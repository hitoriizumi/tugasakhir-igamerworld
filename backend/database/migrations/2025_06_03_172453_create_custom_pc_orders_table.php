<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('custom_pc_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->boolean('build_by_store')->default(false); // apakah dirakit oleh toko
            $table->decimal('build_fee', 12, 2)->default(0);   // biaya perakitan jika dirakit oleh toko
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_pc_orders');
    }
};

