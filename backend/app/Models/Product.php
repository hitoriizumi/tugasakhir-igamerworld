<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'subcategory_id',
        'brand_id',
        'has_igpu',
        'name',
        'description',
        'price',
        'stock',
        'status_stock',
        'main_image',
        'is_active',
    ];

    /**
     * Relasi ke brand
     */
    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * Relasi ke subkategori
     */
    public function subcategory()
    {
        return $this->belongsTo(Subcategory::class);
    }

    /**
     * Relasi ke gambar tambahan (max 5 termasuk main)
     */
    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    /**
     * Relasi ke produk-produk yang kompatibel (many to many)
     */
    public function compatibilities()
    {
        return $this->belongsToMany(
            Product::class,
            'product_compatibilities',
            'product_id',
            'compatible_with_id'
        );
    }

    /**
     * Relasi ke histori entri stok
     */
    public function stockEntries()
    {
        return $this->hasMany(StockEntry::class);
    }

    /**
     * Update status stok secara otomatis berdasarkan jumlah
     */
    public function updateStockStatus()
    {
        if ($this->stock > 0) {
            $this->status_stock = 'ready_stock';
        } elseif ($this->status_stock !== 'pre_order') {
            $this->status_stock = 'out_of_stock';
        }

        $this->save();
    }

    public function wishlistedBy()
    {
        return $this->hasMany(Wishlist::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function customPCComponents()
    {
        return $this->hasMany(CustomPCComponent::class);
    }

}
