<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PaymentMethod;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PaymentMethodController extends Controller
{
    private function authorizeAdminOrSuperadmin()
    {
        $user = auth()->user();
        if (!in_array($user->role_id, [1, 2])) {
            abort(403, 'Hanya admin atau superadmin yang dapat mengakses fitur ini.');
        }
    }

    public function index()
    {
        $this->authorizeAdminOrSuperadmin();
        $methods = PaymentMethod::orderBy('bank_name')->get();
        return response()->json(['data' => $methods]);
    }

    public function publicIndex()
    {
        $methods = PaymentMethod::where('is_active', true)->orderBy('bank_name')->get();
        return response()->json(['data' => $methods]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdminOrSuperadmin();

        $validated = $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_number' => 'nullable|string|max:100',
            'account_holder' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $fileName = 'payment_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $imagePath = $file->storeAs('uploads/payment-methods', $fileName, 'public');
        }

        $method = PaymentMethod::create([
            'bank_name' => $validated['bank_name'],
            'account_number' => $validated['account_number'],
            'account_holder' => $validated['account_holder'],
            'image' => $imagePath ? asset('storage/' . $imagePath) : null,
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Metode pembayaran berhasil ditambahkan', 'data' => $method], 201);
    }

    public function update(Request $request, $id)
    {
        $this->authorizeAdminOrSuperadmin();

        $method = PaymentMethod::findOrFail($id);

        $validated = $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_number' => 'nullable|string|max:100',
            'account_holder' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $oldImage = str_replace(asset('storage') . '/', '', $method->image ?? '');
            if ($oldImage && Storage::disk('public')->exists($oldImage)) {
                Storage::disk('public')->delete($oldImage);
            }

            $file = $request->file('image');
            $fileName = 'payment_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $newPath = $file->storeAs('uploads/payment-methods', $fileName, 'public');
            $method->image = asset('storage/' . $newPath);
        }

        $method->update([
            'bank_name' => $validated['bank_name'],
            'account_number' => $validated['account_number'],
            'account_holder' => $validated['account_holder'],
            'image' => $method->image,
        ]);

        return response()->json(['message' => 'Metode pembayaran berhasil diperbarui', 'data' => $method]);
    }

    public function toggleActive($id)
    {
        $this->authorizeAdminOrSuperadmin();

        $method = PaymentMethod::findOrFail($id);
        $method->is_active = !$method->is_active;
        $method->save();

        return response()->json(['message' => 'Status metode pembayaran berhasil diubah', 'data' => $method]);
    }
}
