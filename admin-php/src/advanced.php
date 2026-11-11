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

function bestseller_ranking_page(): void {
    $items = db()->query('SELECT p.id, p.name, p.sku, p.images, p.price, p.position, p.isFeatured, c.name category FROM Product p JOIN Category c ON c.id=p.categoryId WHERE p.isFeatured=1 ORDER BY p.position ASC, p.updatedAt DESC')->fetchAll();
    $allOther = db()->query('SELECT id, name, sku FROM Product WHERE isFeatured=0 AND active=1 ORDER BY name')->fetchAll();
    ?>
    <section class="panel" style="margin-top:20px;">
      <div class="panel-heading">
        <div>
          <h3>★ Storefront Best Sellers Ranking Desk</h3>
          <p>Curate the order of products showcased in the homepage "Best Sellers" collection. Lower rank numbers appear first.</p>
        </div>
        <span class="badge-featured" style="padding:5px 10px;font-size:12px;background:#fef08a;color:#854d0e;border:1px solid #facc15;border-radius:20px;font-weight:700;"><?=count($items)?> Best Sellers Active</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>Photo</th>
            <th>Product & SKU</th>
            <th>Collection</th>
            <th>Price</th>
            <th>Best Seller Rank</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($items as $item): 
            $imgs = json_decode((string)$item['images'], true) ?: [];
            $thumb = $imgs[0] ?? null;
          ?>
            <tr>
              <td>
                <?php if ($thumb): ?>
                  <img src="<?=e($thumb)?>" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;">
                <?php else: ?>
                  <div style="width:48px;height:48px;background:#f3f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#9ca3af;">No pic</div>
                <?php endif; ?>
              </td>
              <td>
                <strong><?=e($item['name'])?></strong><br>
                <small style="color:#8f2d3e;font-family:monospace;"><?=e($item['sku'])?></small>
              </td>
              <td><?=e($item['category'])?></td>
              <td><strong>₹<?=number_format((int)$item['price'])?></strong></td>
              <td>
                <form method="post" action="/products/ranking" class="inline" style="display:flex;align-items:center;gap:6px;">
                  <input type="hidden" name="_token" value="<?=csrf_token()?>">
                  <input type="hidden" name="product_id" value="<?=e($item['id'])?>">
                  <input type="number" name="position" min="0" value="<?=e($item['position'])?>" style="width:65px;padding:4px 8px;font-size:13px;font-weight:700;border:1px solid #d1d5db;border-radius:7px;text-align:center;">
                  <button type="submit" class="button-secondary" style="padding:4px 10px;font-size:11px;">Update Rank</button>
                </form>
              </td>
              <td>
                <form method="post" action="/products/bestseller" style="margin:0;">
                  <input type="hidden" name="_token" value="<?=csrf_token()?>">
                  <input type="hidden" name="product_id" value="<?=e($item['id'])?>">
                  <button type="submit" class="button-secondary" style="color:#b91c1c;border-color:#fecaca;padding:4px 10px;font-size:11px;" title="Remove from Best Sellers">Remove ★</button>
                </form>
              </td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$items): ?>
            <tr><td colspan="6" class="empty-state">No products marked as Best Sellers yet. Use the dropdown below or the main directory to feature items.</td></tr>
          <?php endif; ?>
        </tbody>
      </table>

      <?php if ($allOther): ?>
        <div style="margin-top:16px;padding:14px;background:#fefce8;border:1px solid #fef08a;border-radius:10px;">
          <h4 style="margin:0 0 8px;font-size:13px;color:#854d0e;">＋ Add Another Product to Best Sellers</h4>
          <form method="post" action="/products/bestseller" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
            <input type="hidden" name="_token" value="<?=csrf_token()?>">
            <input type="hidden" name="featured" value="1">
            <select name="product_id" required style="padding:6px 10px;border-radius:8px;border:1px solid #d1d5db;font-size:12px;min-width:240px;">
              <option value="">Select product to add...</option>
              <?php foreach ($allOther as $other): ?>
                <option value="<?=e($other['id'])?>"><?=e($other['name'])?> (<?=e($other['sku'])?>)</option>
              <?php endforeach; ?>
            </select>
            <button type="submit" class="button-secondary" style="background:#eab308;color:#fff;border-color:#ca8a04;font-weight:700;padding:6px 14px;font-size:12px;">Add to Best Sellers ★</button>
          </form>
        </div>
      <?php endif; ?>
    </section>
    <?php
}
