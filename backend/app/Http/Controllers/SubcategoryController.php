<?php

namespace App\Http\Controllers;

use App\Models\Subcategory;
use Illuminate\Http\Request;

class SubcategoryController extends Controller
{
    /**
     * Tampilkan semua subkategori (untuk admin)
     */
    public function index()
    {
        $this->authorizeAdmin();

        $subcategories = Subcategory::with('category')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $subcategories]);
    }

    /**
     * Tambah subkategori baru
     */
    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255|unique:subcategories,name',
        ]);

        $subcategory = Subcategory::create([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Subcategory created successfully.', 'data' => $subcategory], 201);
    }

    /**
     * Update subkategori
     */
    public function update(Request $request, $id)
    {
        $this->authorizeAdmin();

        $subcategory = Subcategory::findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255|unique:subcategories,name,' . $id,
        ]);

        $subcategory->update([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
        ]);

        return response()->json(['message' => 'Subcategory updated successfully.', 'data' => $subcategory]);
    }

    /**
     * Hapus subkategori
     */
    public function destroy($id)
    {
        $this->authorizeAdmin();

        $subcategory = Subcategory::findOrFail($id);
        $subcategory->delete();

        return response()->json(['message' => 'Subcategory deleted successfully.']);
    }

    /**
     * Aktif/nonaktifkan subkategori
     */
    public function toggleStatus($id)
    {
        $this->authorizeAdmin();

        $subcategory = Subcategory::findOrFail($id);
        $subcategory->is_active = !$subcategory->is_active;
        $subcategory->save();

        return response()->json([
            'message' => 'Subcategory status updated.',
            'is_active' => $subcategory->is_active
        ]);
    }

    /**
     * Validasi role admin
     */
    private function authorizeAdmin()
    {
        if (!auth()->check() || auth()->user()->role_id !== 2) {
            abort(403, 'Hanya admin yang dapat mengakses fitur ini.');
        }
    }
}
