<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCartsTable extends Migration
{
    public function up()
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();

            // Relasi ke pelanggan
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Relasi ke produk
            $table->foreignId('product_id')->constrained()->onDelete('cascade');

            // Jumlah yang diminta pelanggan
            $table->unsignedInteger('quantity')->default(1);

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('carts');
    }
}
