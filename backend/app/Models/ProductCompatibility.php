<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductCompatibility extends Model
{
    protected $table = 'product_compatibilities';

    protected $fillable = [
        'product_id',
        'compatible_with_id',
    ];

    public $timestamps = true;
}
