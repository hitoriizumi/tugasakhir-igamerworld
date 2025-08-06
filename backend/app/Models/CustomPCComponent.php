<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomPCComponent extends Model
{
    use HasFactory;

    protected $table = 'custom_pc_components';

    protected $fillable = [
        'custom_pc_order_id',
        'product_id',
        'quantity',
    ];

    public function customPCOrder()
    {
        return $this->belongsTo(CustomPCOrder::class, 'custom_pc_order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}

