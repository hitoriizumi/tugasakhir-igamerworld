<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomPCOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'build_by_store',
        'build_fee',
    ];

    protected $table = 'custom_pc_orders';

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function custom_pc_components()
    {
        return $this->hasMany(CustomPCComponent::class, 'custom_pc_order_id');
    }

}

