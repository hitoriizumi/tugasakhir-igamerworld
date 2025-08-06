<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

use Carbon\Carbon;

class UserController extends Controller
{
    // 🛡️ Batasi akses hanya untuk superadmin
    private function authorizeSuperadminOnly()
    {
        $user = auth()->user();
        if ($user->role_id !== 1) {
            abort(403, 'Hanya superadmin yang dapat mengakses fitur ini.');
        }
    }

    /**
     * Superadmin: Lihat semua admin
     */
    public function getAdmins()
    {
        $this->authorizeSuperadminOnly();

        $admins = User::withTrashed()
            ->where('role_id', 2)
            ->orderByDesc('deleted_at')
            ->get();

        return response()->json($admins);
    }

    /**
     * Superadmin: Tambah admin baru
     */
    public function createAdmin(Request $request)
    {
        $this->authorizeSuperadminOnly();

        $request->validate([
            'name'     => 'required|string|max:255',
            'username' => 'required|string|max:50|unique:users,username',
            'email'    => 'required|email|unique:users,email',
            'password' => [
                'required', 'string', 'min:8',
                'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/', 'regex:/[@$!%*#?&]/'
            ],
            'phone'    => 'nullable|string|max:20',
        ]);

        $admin = User::create([
            'name'     => $request->name,
            'username' => $request->username,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'phone'    => $request->phone,
            'role_id'  => 2,
        ]);

        return response()->json([
            'message' => 'Akun admin berhasil dibuat',
            'user'    => $admin
        ], 201);
    }

    /**
     * Superadmin: Ambil admin by id
     */
    public function getAdminById($id)
    {
        $this->authorizeSuperadminOnly();

        $admin = User::where('id', $id)
            ->where('role_id', 2)
            ->firstOrFail();

        return response()->json($admin);
    }

    /**
     * Superadmin: Update admin
     */
    public function updateAdmin(Request $request, $id)
    {
        $this->authorizeSuperadminOnly();

        $admin = User::where('id', $id)->where('role_id', 2)->firstOrFail();

        $request->validate([
            'name'     => 'required|string|max:255',
            'username' => ['required', 'string', 'max:50', Rule::unique('users')->ignore($admin->id)],
            'email'    => ['required', 'email', Rule::unique('users')->ignore($admin->id)],
            'phone'    => 'nullable|string|max:20',
        ]);

        $admin->update([
            'name'     => $request->name,
            'username' => $request->username,
            'email'    => $request->email,
            'phone'    => $request->phone,
        ]);

        return response()->json(['message' => 'Admin berhasil diupdate']);
    }

    /**
     * Superadmin: Nonaktifkan (soft delete) admin
     */
    public function softDeleteAdmin($id)
    {
        $this->authorizeSuperadminOnly();

        $admin = User::where('id', $id)->where('role_id', 2)->firstOrFail();
        $admin->delete();

        return response()->json(['message' => 'Admin telah dinonaktifkan']);
    }

    /**
     * Superadmin: Aktifkan kembali admin
     */
    public function restoreAdmin($id)
    {
        $this->authorizeSuperadminOnly();

        $admin = User::withTrashed()->where('id', $id)->where('role_id', 2)->firstOrFail();

        if (!$admin->deleted_at) {
            return response()->json(['message' => 'Akun sudah aktif'], 400);
        }

        $admin->restore();

        return response()->json(['message' => 'Admin berhasil diaktifkan kembali']);
    }

    /**
     * Semua role: Lihat profil sendiri
     */
    public function getProfile(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Semua role: Update profil sendiri
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name'     => 'required|string|max:255',
            'username' => ['required', 'string', 'max:50', Rule::unique('users')->ignore($user->id)],
            'email'    => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'phone'    => 'nullable|string|max:20',
        ]);

        $user->update([
            'name'     => $request->name,
            'username' => $request->username,
            'email'    => $request->email,
            'phone'    => $request->phone,
        ]);

        return response()->json(['message' => 'Profil berhasil diperbarui']);
    }

    /**
     * Semua role: Ubah password sendiri
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required',
            'new_password' => [
                'required', 'string', 'min:8', 'different:current_password',
                'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/', 'regex:/[@$!%*#?&]/',
            ],
            'confirm_password' => 'required|same:new_password',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Password lama salah'], 403);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json(['message' => 'Password berhasil diubah']);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // Generate token dan simpan ke table password_resets
        $token = Str::random(60);
        DB::table('password_resets')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => $token,
                'created_at' => Carbon::now()
            ]
        );

        // Kirim email (gunakan Mailtrap saat dev)
        $resetLink = url("/reset-password/{$token}");
        Mail::raw("Klik link berikut untuk mengatur ulang password Anda: {$resetLink}", function ($message) use ($request) {
            $message->to($request->email)
                ->subject('Reset Password');
        });

        return response()->json(['message' => 'Link reset password telah dikirim ke email Anda.']);
    }

    /**
     * Reset Password: Simpan password baru
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email|exists:users,email',
            'password' => [
                'required', 'string', 'min:8',
                'regex:/[a-z]/', 'regex:/[A-Z]/',
                'regex:/[0-9]/', 'regex:/[@$!%*#?&]/'
            ],
            'password_confirmation' => 'required|same:password',
        ]);

        $resetData = DB::table('password_resets')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (!$resetData || \Carbon\Carbon::parse($resetData->created_at)->addMinutes(60)->isPast()) {
            return response()->json(['message' => 'Token reset tidak valid atau telah kedaluwarsa.'], 400);
        }

        $user = User::where('email', $request->email)->first();
        $user->update([
            'password' => Hash::make($request->password)
        ]);

        DB::table('password_resets')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password berhasil direset. Silakan login kembali.']);
    }
}
