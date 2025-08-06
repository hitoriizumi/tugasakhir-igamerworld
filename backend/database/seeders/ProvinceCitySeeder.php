<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Province;
use App\Models\City;
use Illuminate\Support\Facades\File;

class ProvinceCitySeeder extends Seeder
{
    public function run(): void
    {
        $json = File::get(database_path('data/indonesia_provinces_cities.json'));
        $data = json_decode($json, true);

        foreach ($data as $provinceData) {
            // Insert Province
            Province::create([
                'id' => $provinceData['province_id'],
                'name' => $provinceData['province'],
            ]);

            // Insert Cities
            foreach ($provinceData['cities'] as $cityData) {
                City::create([
                    'id' => $cityData['city_id'],
                    'province_id' => $provinceData['province_id'],
                    'name' => $cityData['city_name'],
                ]);
            }
        }
    }
}
