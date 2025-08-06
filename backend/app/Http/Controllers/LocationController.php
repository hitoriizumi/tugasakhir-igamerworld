<?php

namespace App\Http\Controllers;

use App\Models\Province;
use App\Models\City;

class LocationController extends Controller
{
    /**
     * Menampilkan semua provinsi
     */
    public function getProvinces()
    {
        $provinces = Province::orderBy('name')->get();
        return response()->json(['data' => $provinces]);
    }

    /**
     * Menampilkan semua kota berdasarkan provinsi
     */
    public function getCities($province_id)
    {
        $cities = City::where('province_id', $province_id)
                      ->orderBy('name')
                      ->get();
        return response()->json(['data' => $cities]);
    }
}
