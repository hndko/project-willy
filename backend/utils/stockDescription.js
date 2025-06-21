function stockDescription({ action, qty, product, rawMaterial, user, extra }) {
  switch (action) {
    case "sale":
      return `Stock keluar karena penjualan: ${qty} unit produk \"${product?.name || "-"}\" oleh user \"${user?.name || "-"}\"${extra ? ` (${extra})` : ""}`;
    case "purchase":
      return `Stock masuk karena pembelian: ${qty} unit bahan baku \"${rawMaterial?.name || "-"}\"${extra?.supplierName ? ` dari supplier \"${extra.supplierName}\"` : ""}`;
    case "production_in":
      return `Stock masuk hasil produksi: ${qty} unit produk \"${product?.name || "-"}\" oleh user \"${user?.name || "-"}\"`;
    case "production_out":
      return `Stock keluar untuk produksi: ${qty} unit bahan baku \"${rawMaterial?.name || "-"}\" untuk produk \"${extra?.productName || "-"}\"`;
    case "usage":
      return `Stock keluar karena penggunaan bahan baku: ${qty} unit \"${rawMaterial?.name || "-"}\" oleh user \"${user?.name || "-"}\"`;
    case "manual_in":
      return `Stock masuk (penyesuaian manual): ${qty} unit ${product ? `produk \"${product.name}\"` : rawMaterial ? `bahan baku \"${rawMaterial.name}\"` : ""}`;
    case "manual_out":
      return `Stock keluar (penyesuaian manual): ${qty} unit ${product ? `produk \"${product.name}\"` : rawMaterial ? `bahan baku \"${rawMaterial.name}\"` : ""}`;
    default:
      return `Perubahan stok: ${qty} unit`;
  }
}

module.exports = { stockDescription };
