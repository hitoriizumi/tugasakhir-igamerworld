<?php

namespace App\Http\Controllers;

use App\Models\ShippingAddress;
use Illuminate\Http\Request;

class ShippingAddressController extends Controller
{
    /**
     * Menampilkan semua alamat milik pelanggan (yang login)
     */
    public function index()
    {
        $this->authorizeCustomer();

        $user = auth()->user();

        $addresses = ShippingAddress::with(['province', 'city'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json(['data' => $addresses]);
    }

    /**
     * Menambahkan alamat baru
     */
    public function store(Request $request)
    {
        $this->authorizeCustomer();

        $request->validate([
            'recipient_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'province_id' => 'required|exists:provinces,id',
            'city_id' => 'required|exists:cities,id',
            'full_address' => 'required|string',
            'postal_code' => 'required|string|max:10',
            'notes' => 'nullable|string',
        ]);

        $user = auth()->user();

        $isFirstAddress = ShippingAddress::where('user_id', $user->id)->doesntExist();

        $address = ShippingAddress::create([
            'user_id'        => $user->id,
            'recipient_name' => $request->recipient_name,
            'phone_number'   => $request->phone_number,
            'province_id'    => $request->province_id,
            'city_id'        => $request->city_id,
            'full_address'   => $request->full_address,
            'postal_code'    => $request->postal_code,
            'notes'          => $request->notes,
            'is_primary'     => $isFirstAddress,
            'is_active'      => true,
        ]);

        return response()->json(['message' => 'Alamat berhasil ditambahkan.', 'data' => $address]);
    }

    /**
     * Mengupdate alamat tertentu
     */
    public function update(Request $request, $id)
    {
        $this->authorizeCustomer();

        $request->validate([
            'recipient_name' => 'required|string|max:255',
            'phone_number'   => 'required|string|max:20',
            'province_id'    => 'required|exists:provinces,id',
            'city_id'        => 'required|exists:cities,id',
            'full_address'   => 'required|string',
            'postal_code'    => 'required|string|max:10',
            'notes'          => 'nullable|string',
        ]);

        $user = auth()->user();

        $address = ShippingAddress::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if (!$address->is_active) {
            return response()->json(['message' => 'Alamat tidak aktif tidak bisa diperbarui.'], 422);
        }

        $address->update([
            'recipient_name' => $request->recipient_name,
            'phone_number'   => $request->phone_number,
            'province_id'    => $request->province_id,
            'city_id'        => $request->city_id,
            'full_address'   => $request->full_address,
            'postal_code'    => $request->postal_code,
            'notes'          => $request->notes,
        ]);

        return response()->json(['message' => 'Alamat berhasil diperbarui.']);
    }

    /**
     * Menjadikan alamat ini sebagai alamat utama
     */
    public function setPrimary($id)
    {
        $this->authorizeCustomer();

        $user = auth()->user();

        $address = ShippingAddress::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if (!$address->is_active) {
            return response()->json(['message' => 'Alamat tidak aktif tidak bisa dijadikan alamat utama.'], 422);
        }

        ShippingAddress::where('user_id', $user->id)->update(['is_primary' => false]);

        $address->update(['is_primary' => true]);

        return response()->json(['message' => 'Alamat ini sekarang menjadi alamat utama.']);
    }

    /**
     * Mengaktifkan / Menonaktifkan alamat
     */
    public function toggleActive($id)
    {
        $this->authorizeCustomer();

        $user = auth()->user();

        $address = ShippingAddress::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($address->is_primary && $address->is_active) {
            return response()->json(['message' => 'Alamat utama tidak boleh dinonaktifkan.'], 422);
        }

        $address->update(['is_active' => !$address->is_active]);

        return response()->json(['message' => 'Status alamat berhasil diubah.']);
    }

    /**
     * 🔒 Validasi role pelanggan (role_id = 3)
     */
    private function authorizeCustomer()
    {
        abort_if(!auth()->check() || auth()->user()->role_id !== 3, 403, 'Hanya pelanggan yang dapat mengakses fitur alamat.');
    }
}
