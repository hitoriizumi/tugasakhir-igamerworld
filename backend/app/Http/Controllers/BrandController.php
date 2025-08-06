<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    public function index()
    {
        $this->authorizeAdmin();

        $brands = Brand::orderBy('name')->get();

        return response()->json(['data' => $brands]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:brands,name',
            'slug' => 'required|string|max:255|unique:brands,slug',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $fileName = 'brand_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $logoPath = $file->storeAs('uploads/brands', $fileName, 'public');
        }

        $brand = Brand::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'logo' => $logoPath ? asset('storage/' . $logoPath) : null,
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Brand created successfully.', 'data' => $brand], 201);
    }

    public function update(Request $request, $id)
    {
        $this->authorizeAdmin();

        $brand = Brand::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:brands,name,' . $id,
            'slug' => 'required|string|max:255|unique:brands,slug,' . $id,
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            if ($brand->logo && str_starts_with($brand->logo, asset('storage'))) {
                $oldPath = str_replace(asset('storage') . '/', '', $brand->logo);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            $file = $request->file('logo');
            $fileName = 'brand_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $newPath = $file->storeAs('uploads/brands', $fileName, 'public');

            $brand->logo = asset('storage/' . $newPath);
        }

        $brand->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'logo' => $brand->logo // tetap disimpan jika tidak diubah
        ]);

        return response()->json(['message' => 'Brand updated successfully.', 'data' => $brand]);
    }

    public function destroy($id)
    {
        $this->authorizeAdmin();

        $brand = Brand::findOrFail($id);

        if ($brand->logo && str_starts_with($brand->logo, asset('storage'))) {
            $oldPath = str_replace(asset('storage') . '/', '', $brand->logo);
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        $brand->delete();

        return response()->json(['message' => 'Brand deleted successfully.']);
    }

    public function toggleStatus($id)
    {
        $this->authorizeAdmin();

        $brand = Brand::findOrFail($id);
        $brand->is_active = !$brand->is_active;
        $brand->save();

        return response()->json([
            'message' => 'Brand status updated.',
            'is_active' => $brand->is_active
        ]);
    }

    private function authorizeAdmin()
    {
        if (!auth()->check() || auth()->user()->role_id !== 2) {
            abort(403, 'Hanya admin yang dapat mengakses fitur ini.');
        }
    }
}
