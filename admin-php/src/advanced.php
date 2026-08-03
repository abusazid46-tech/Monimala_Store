<?php
declare(strict_types=1);

function category_ranking_page(): void {
    $items = db()->query('SELECT id,name,position FROM Category WHERE parentId IS NULL ORDER BY position,createdAt')->fetchAll();
    ?>
    <section class="panel">
      <h3>Storefront category ranking</h3>
      <p>Lower numbers appear first. Use 10, 20, 30 to leave room between categories.</p>
      <table><thead><tr><th>Category</th><th>Position</th></tr></thead><tbody>
      <?php foreach ($items as $item): ?>
        <tr><td><?=e($item['name'])?></td><td>
          <form method="post" action="/categories/ranking" class="inline">
            <input type="hidden" name="_token" value="<?=csrf_token()?>">
            <input type="hidden" name="category_id" value="<?=e($item['id'])?>">
            <input type="number" name="position" min="0" value="<?=e($item['position'])?>" required>
            <button>Update rank</button>
          </form>
        </td></tr>
      <?php endforeach ?>
      </tbody></table>
    </section>
    <?php
}

function product_advanced_page(): void {
    $items = db()->query('SELECT id,name,sku,images,colors,sizes,youtubeUrl,position FROM Product ORDER BY position,updatedAt DESC')->fetchAll();
    ?>
    <style>.advanced-product{border-top:1px solid #eadfce;padding:20px 0}.advanced-product h4{font-size:18px;margin:0 0 12px}.advanced-product h4 small{color:#777;font-weight:400}.admin-gallery{display:flex;gap:8px;overflow:auto;margin-bottom:14px}.admin-gallery img{width:80px;height:80px;object-fit:cover;border-radius:9px;border:1px solid #eadfce}.advanced-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.advanced-grid form{display:grid;gap:9px;padding:14px;background:#f8f3eb;border-radius:10px}.advanced-grid label{display:grid;gap:5px}@media(max-width:900px){.advanced-grid{grid-template-columns:1fr}}</style>
    <section class="panel">
      <h3>Product galleries, colours, sizes and ranking</h3>
      <p>Upload 4–5 gallery photos for a premium product page. Lower ranking numbers appear first. For bangles use sizes: 2.0, 2.2, 2.4, 2.6, 2.8, 3.</p>
      <?php foreach ($items as $item):
        $images=json_decode((string)$item['images'],true)?:[];
        $colors=json_decode((string)($item['colors']??''),true)?:[];
        $sizes=json_decode((string)($item['sizes']??''),true)?:[];
      ?>
        <article class="advanced-product">
          <h4><?=e($item['name'])?> <small><?=e($item['sku'])?></small></h4>
          <div class="admin-gallery"><?php foreach($images as $image):?><img src="<?=e($image)?>" alt=""><?php endforeach?></div>
          <div class="advanced-grid">
            <form method="post" action="/products/gallery" enctype="multipart/form-data">
              <input type="hidden" name="_token" value="<?=csrf_token()?>">
              <input type="hidden" name="product_id" value="<?=e($item['id'])?>">
              <label>Replace gallery (up to 5 JPG/PNG/WebP)<input type="file" name="gallery_files[]" accept=".jpg,.jpeg,.png,.webp" multiple></label>
              <label>Or image URLs, one per line<textarea name="gallery_urls"></textarea></label>
              <button>Replace gallery</button>
            </form>
            <form method="post" action="/products/options" enctype="multipart/form-data">
              <input type="hidden" name="_token" value="<?=csrf_token()?>">
              <input type="hidden" name="product_id" value="<?=e($item['id'])?>">
              <label>Colours, comma separated<input name="colors" value="<?=e(implode(', ',$colors))?>" placeholder="Gold, Rose Gold, Silver"></label>
              <label>Sizes, comma separated<input name="sizes" value="<?=e(implode(', ',$sizes))?>" placeholder="2.0, 2.2, 2.4, 2.6, 2.8, 3"></label>
              <label>Storefront rank<input type="number" min="0" name="position" value="<?=e($item['position'])?>"></label>
              <label>YouTube product video URL<input type="url" name="youtube_url" value="<?=e($item['youtubeUrl']??'')?>" placeholder="https://www.youtube.com/watch?v=..."></label>
              <label>Map/replace one colour image<input name="color_name" placeholder="Colour name"></label>
              <label>Colour image<input type="file" name="color_image_file" accept=".jpg,.jpeg,.png,.webp"></label>
              <button>Save options and rank</button>
            </form>
          </div>
        </article>
      <?php endforeach ?>
    </section>
    <?php
}
