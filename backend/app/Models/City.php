<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class City extends Model
{
    protected $fillable = ['id', 'province_id', 'name'];
    public $incrementing = false;
    protected $keyType = 'int';

    public function province()
    {
        return $this->belongsTo(Province::class);
    }
}


