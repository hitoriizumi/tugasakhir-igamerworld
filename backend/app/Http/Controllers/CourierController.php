<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Courier;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CourierController extends Controller
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
        $couriers = Courier::orderBy('name')->get();
        return response()->json(['data' => $couriers]);
    }

    public function publicIndex()
    {
        $couriers = Courier::where('is_active', true)->orderBy('name')->get();
        return response()->json(['data' => $couriers]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdminOrSuperadmin();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:couriers,code',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $fileName = 'courier_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $imagePath = $file->storeAs('uploads/couriers', $fileName, 'public');
        }

        $courier = Courier::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'description' => $validated['description'] ?? null,
            'image' => $imagePath ? asset('storage/' . $imagePath) : null,
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Kurir berhasil ditambahkan', 'data' => $courier], 201);
    }

    public function update(Request $request, $id)
    {
        $this->authorizeAdminOrSuperadmin();

        $courier = Courier::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:couriers,code,' . $id,
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $oldImage = str_replace(asset('storage') . '/', '', $courier->image ?? '');
            if ($oldImage && Storage::disk('public')->exists($oldImage)) {
                Storage::disk('public')->delete($oldImage);
            }

            $file = $request->file('image');
            $fileName = 'courier_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $newPath = $file->storeAs('uploads/couriers', $fileName, 'public');
            $courier->image = asset('storage/' . $newPath);
        }

        $courier->update([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'description' => $validated['description'] ?? null,
            'image' => $courier->image,
        ]);

        return response()->json(['message' => 'Kurir berhasil diperbarui', 'data' => $courier]);
    }

    public function toggleActive($id)
    {
        $this->authorizeAdminOrSuperadmin();

        $courier = Courier::findOrFail($id);
        $courier->is_active = !$courier->is_active;
        $courier->save();

        return response()->json(['message' => 'Status kurir berhasil diubah', 'data' => $courier]);
    }
}
