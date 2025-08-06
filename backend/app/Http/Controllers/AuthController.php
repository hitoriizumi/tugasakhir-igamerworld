<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register pelanggan (role_id = 3)
     */
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'username' => 'required|string|max:50|unique:users,username',
            'email'    => 'required|email|unique:users,email',
            'password' => [
                'required', 'string', 'min:8',
                'regex:/[a-z]/',      // huruf kecil
                'regex:/[A-Z]/',      // huruf besar
                'regex:/[0-9]/',      // angka
                'regex:/[@$!%*#?&]/', // simbol
            ],
            'phone'    => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'username' => $request->username,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'phone'    => $request->phone,
            'role_id'  => 3, // pelanggan
        ]);

        return response()->json([
            'message' => 'Registrasi berhasil',
            'user'    => $user
        ], 201);
    }

    /**
     * Login multi-role dengan validasi role_id
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'         => 'required|email',
            'password'      => 'required',
            'expected_role' => 'required|in:1,2,3',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah'
            ], 401);
        }

        if ((int)$request->expected_role !== $user->role_id) {
            return response()->json([
                'message' => 'Role tidak sesuai untuk akun ini'
            ], 403);
        }

        $tokenName = 'auth_token_role_' . $user->role_id;
        $token = $user->createToken($tokenName)->plainTextToken;

        return response()->json([
            'message'       => 'Login berhasil',
            'access_token'  => $token,
            'token_type'    => 'Bearer',
            'role_id'       => $user->role_id,
            'name'          => $user->name,
            'email'         => $user->email,
            'username'      => $user->username,
        ]);
    }

    /**
     * Logout dari token aktif saat ini
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil'
        ]);
    }
}
