<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/bootstrap.php';
require dirname(__DIR__) . '/src/advanced.php';
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
if (base_path() && str_starts_with($path, base_path())) $path = substr($path, strlen(base_path())) ?: '/';
$path = rtrim($path, '/') ?: '/';
$method = $_SERVER['REQUEST_METHOD'];

if ($path === '/login' && $method === 'GET') { login_page(); exit; }
if ($path === '/login' && $method === 'POST') {
    verify_csrf();
    $stmt = db()->prepare('SELECT id,name,email,passwordHash,role FROM User WHERE email=? LIMIT 1');
    $stmt->execute([strtolower(trim($_POST['email'] ?? ''))]); $user = $stmt->fetch();
    if ($user && $user['role'] === 'ADMIN' && password_verify($_POST['password'] ?? '', $user['passwordHash'])) {
        session_regenerate_id(true); $_SESSION['admin'] = array_intersect_key($user, array_flip(['id','name','email'])); redirect('/');
    }
    login_page('Invalid administrator credentials.'); exit;
}
if ($path === '/logout' && $method === 'POST') { verify_csrf(); session_destroy(); redirect('/login'); }
require_admin();

if ($path === '/inventory/adjust' && $method === 'POST') {
    verify_csrf(); $productId=(string)($_POST['product_id']??''); $quantity=filter_var($_POST['quantity']??null,FILTER_VALIDATE_INT); $reason=trim((string)($_POST['reason']??''));
    if ($productId==='' || $quantity===false || $quantity===0 || strlen($reason)<3) { flash_set('error', 'Invalid stock adjustment parameters.'); redirect('/inventory'); }
    $pdo=db(); $pdo->beginTransaction();
    try {
        $stmt=$pdo->prepare('SELECT stock FROM Product WHERE id=? FOR UPDATE'); $stmt->execute([$productId]); $product=$stmt->fetch();
        if (!$product || (int)$product['stock']+$quantity<0) throw new RuntimeException('Stock cannot become negative.');
        $pdo->prepare('UPDATE Product SET stock=stock+?,updatedAt=NOW(3) WHERE id=?')->execute([$quantity,$productId]);
        $pdo->prepare('INSERT INTO InventoryMovement (id,productId,actorId,quantity,reason,reference,createdAt) VALUES (?,?,?,?,?,?,NOW(3))')->execute(['php_'.bin2hex(random_bytes(12)),$productId,admin()['id'],$quantity,$reason,trim((string)($_POST['reference']??''))?:null]);
        $pdo->commit(); flash_set('success', 'Stock adjustment successfully posted.'); redirect('/inventory');
    } catch(Throwable $error) { $pdo->rollBack(); flash_set('error', $error->getMessage()); redirect('/inventory'); }
}
if ($path === '/orders/status' && $method === 'POST') {
    verify_csrf(); $allowed=['PENDING','PAID','PACKED','SHIPPED','DELIVERED','CANCELLED'];
    if (!in_array($_POST['status']??'',$allowed,true)) { flash_set('error', 'Invalid order status selected.'); redirect('/orders'); }
    $paymentStatus = in_array($_POST['status'], ['PAID','PACKED','SHIPPED','DELIVERED'], true) ? 'PAID' : 'UNPAID';
    db()->prepare('UPDATE `Order` SET status=?,paymentStatus=?,updatedAt=NOW(3) WHERE id=?')->execute([$_POST['status'],$paymentStatus,$_POST['order_id']]);
    flash_set('success', 'Order status updated to ' . $_POST['status']);
    redirect('/orders');
}
if ($path === '/coupons/create' && $method === 'POST') {
    verify_csrf();
    $code = strtoupper(trim((string)($_POST['code'] ?? '')));
    $percent = filter_var($_POST['percent'] ?? null, FILTER_VALIDATE_INT);
    $expiry = trim((string)($_POST['expires_at'] ?? '')) ?: null;
    if ($code === '' || $percent === false || $percent < 1 || $percent > 100) {
        flash_set('error', 'Enter a valid coupon code and percentage (1-100%).');
        redirect('/coupons');
    }
    try {
        db()->prepare('INSERT INTO Coupon (id,code,percent,active,expiresAt) VALUES (?,?,?,1,?)')->execute([
            'php_'.bin2hex(random_bytes(12)), $code, $percent, $expiry ? $expiry.' 23:59:59' : null
        ]);
        flash_set('success', "Coupon $code created successfully.");
    } catch (PDOException $e) {
        flash_set('error', 'That coupon code already exists.');
    }
    redirect('/coupons');
}
if ($path === '/coupons/toggle' && $method === 'POST') {
    verify_csrf();
    $id = trim((string)($_POST['coupon_id'] ?? ''));
    $active = isset($_POST['active']) && $_POST['active'] === '1' ? 1 : 0;
    db()->prepare('UPDATE Coupon SET active=? WHERE id=?')->execute([$active, $id]);
    flash_set('success', 'Coupon status updated.');
    redirect('/coupons');
}
if ($path === '/coupons/delete' && $method === 'POST') {
    verify_csrf();
    $id = trim((string)($_POST['coupon_id'] ?? ''));
    db()->prepare('DELETE FROM Coupon WHERE id=?')->execute([$id]);
    flash_set('success', 'Coupon deleted.');
    redirect('/coupons');
}
if ($path === '/products/delete' && $method === 'POST') {
    verify_csrf();
    $id = trim((string)($_POST['product_id'] ?? ''));
    if ($id === '') {
        flash_set('error', 'Invalid product ID.');
        redirect('/products');
    }
    $stmt = db()->prepare('SELECT id, name FROM Product WHERE id=? LIMIT 1');
    $stmt->execute([$id]);
    $prod = $stmt->fetch();
    if (!$prod) {
        flash_set('error', 'Product not found.');
        redirect('/products');
    }
    $prodName = $prod['name'];

    $stmt = db()->prepare('SELECT COUNT(*) FROM OrderItem WHERE productId=?');
    $stmt->execute([$id]);
    $orderCount = (int)$stmt->fetchColumn();

    if ($orderCount > 0) {
        db()->prepare('UPDATE Product SET active=0, stock=0, updatedAt=NOW(3) WHERE id=?')->execute([$id]);
        flash_set('warning', "Product '$prodName' is referenced in $orderCount order(s). It has been deactivated and archived instead of permanently deleted to preserve invoice and financial audit records.");
    } else {
        $pdo = db();
        $pdo->beginTransaction();
        try {
            $pdo->prepare('DELETE FROM WishlistItem WHERE productId=?')->execute([$id]);
            $pdo->prepare('DELETE FROM Review WHERE productId=?')->execute([$id]);
            $pdo->prepare('DELETE FROM InventoryMovement WHERE productId=?')->execute([$id]);
            $pdo->prepare('DELETE FROM Product WHERE id=?')->execute([$id]);
            $pdo->commit();
            flash_set('success', "Product '$prodName' permanently deleted.");
        } catch (Throwable $e) {
            $pdo->rollBack();
            flash_set('error', 'Failed to delete product: ' . $e->getMessage());
        }
    }
    redirect('/products');
}
if ($path === '/categories/delete' && $method === 'POST') {
    verify_csrf();
    $id = trim((string)($_POST['category_id'] ?? ''));
    if ($id === '') {
        flash_set('error', 'Invalid category ID.');
        redirect('/categories');
    }
    $stmt = db()->prepare('SELECT id, name FROM Category WHERE id=? LIMIT 1');
    $stmt->execute([$id]);
    $cat = $stmt->fetch();
    if (!$cat) {
        flash_set('error', 'Category not found.');
        redirect('/categories');
    }
    $catName = $cat['name'];

    $stmt = db()->prepare('SELECT COUNT(*) FROM Product WHERE categoryId=?');
    $stmt->execute([$id]);
    $prodCount = (int)$stmt->fetchColumn();

    if ($prodCount > 0) {
        flash_set('error', "Cannot delete category '$catName': $prodCount product(s) are assigned to it. Please reassign or delete these products first.");
    } else {
        $pdo = db();
        $pdo->beginTransaction();
        try {
            $pdo->prepare('UPDATE Category SET parentId=NULL WHERE parentId=?')->execute([$id]);
            $pdo->prepare('DELETE FROM Category WHERE id=?')->execute([$id]);
            $pdo->commit();
            flash_set('success', "Category '$catName' deleted successfully.");
        } catch (Throwable $e) {
            $pdo->rollBack();
            flash_set('error', 'Failed to delete category: ' . $e->getMessage());
        }
    }
    redirect('/categories');
}
if ($path === '/products/update' && $method === 'POST') {
    verify_csrf();
    $id=trim((string)($_POST['product_id']??'')); $name=trim((string)($_POST['name']??'')); $slug=slugify((string)($_POST['slug']??''));
    $sku=strtoupper(trim((string)($_POST['sku']??''))); $price=filter_var($_POST['price']??null,FILTER_VALIDATE_INT); $low=filter_var($_POST['low_stock_at']??null,FILTER_VALIDATE_INT);
    $compareRaw=trim((string)($_POST['compare_at']??'')); $compareAt=$compareRaw===''?null:filter_var($compareRaw,FILTER_VALIDATE_INT);
    $youtubeUrl=trim((string)($_POST['youtube_url']??'')); $colors=list_values((string)($_POST['colors']??'')); $sizes=list_values((string)($_POST['sizes']??''));
    if ($id==='' || strlen($name)<2 || $slug==='' || $sku==='' || empty($_POST['category_id']) || $price===false || $price<0 || $low===false || $low<0 || ($compareRaw!=='' && ($compareAt===false || $compareAt<0))) {
        flash_set('error', 'Complete every required product field with valid values.');
        redirect('/products/edit?id='.urlencode($id));
    }
    if($youtubeUrl!=='' && (!filter_var($youtubeUrl,FILTER_VALIDATE_URL) || !preg_match('/(^|\.)((youtube\.com)|(youtu\.be))$/i',(string)parse_url($youtubeUrl,PHP_URL_HOST)))) {
        flash_set('error', 'Enter a valid YouTube URL.');
        redirect('/products/edit?id='.urlencode($id));
    }

    $existing = isset($_POST['existing_images']) && is_array($_POST['existing_images']) ? array_filter(array_map('trim', $_POST['existing_images'])) : [];
    $gallerySelected = isset($_POST['gallery_selected']) && is_array($_POST['gallery_selected']) ? array_filter(array_map('trim', $_POST['gallery_selected'])) : [];
    $uploads = uploaded_product_images($_FILES['image_files'] ?? null);
    $rawUrls = trim((string)($_POST['image_urls'] ?? ''));
    $urlList = array_values(array_filter(array_map('trim', preg_split('/[\r\n,]+/', $rawUrls) ?: [])));
    $images = array_values(array_unique(array_merge($existing, $gallerySelected, $uploads, $urlList)));

    try {
        if ($images) {
            db()->prepare('UPDATE Product SET name=?,slug=?,sku=?,categoryId=?,description=?,price=?,compareAt=?,lowStockAt=?,metal=?,occasion=?,colors=?,sizes=?,youtubeUrl=?,position=?,isFeatured=?,isNew=?,active=?,images=?,updatedAt=NOW(3) WHERE id=?')->execute([$name,$slug,$sku,(string)$_POST['category_id'],trim((string)($_POST['description']??'')),$price,$compareAt,$low,trim((string)($_POST['metal']??''))?:null,trim((string)($_POST['occasion']??''))?:null,json_encode($colors),json_encode($sizes),$youtubeUrl?:null,max(0,(int)($_POST['position']??0)),isset($_POST['featured'])?1:0,isset($_POST['is_new'])?1:0,isset($_POST['active'])?1:0,json_encode($images,JSON_UNESCAPED_SLASHES),$id]);
        } else {
            db()->prepare('UPDATE Product SET name=?,slug=?,sku=?,categoryId=?,description=?,price=?,compareAt=?,lowStockAt=?,metal=?,occasion=?,colors=?,sizes=?,youtubeUrl=?,position=?,isFeatured=?,isNew=?,active=?,updatedAt=NOW(3) WHERE id=?')->execute([$name,$slug,$sku,(string)$_POST['category_id'],trim((string)($_POST['description']??'')),$price,$compareAt,$low,trim((string)($_POST['metal']??''))?:null,trim((string)($_POST['occasion']??''))?:null,json_encode($colors),json_encode($sizes),$youtubeUrl?:null,max(0,(int)($_POST['position']??0)),isset($_POST['featured'])?1:0,isset($_POST['is_new'])?1:0,isset($_POST['active'])?1:0,$id]);
        }
        flash_set('success', "Product '$name' updated successfully.");
    } catch(PDOException $error) {
        flash_set('error', $error->getCode()==='23000'?'That SKU or slug is already in use.':'Unable to update this product.');
    }
    redirect('/products');
}
if ($path === '/products/gallery' && $method === 'POST') {
    verify_csrf(); $id=trim((string)($_POST['product_id']??'')); $uploads=uploaded_product_images($_FILES['gallery_files']??null);
    $urls=array_values(array_filter(array_map('trim',preg_split('/[\r\n,]+/',(string)($_POST['gallery_urls']??''))?:[]))); $images=array_values(array_unique(array_merge($uploads,$urls)));
    if($id==='' || count($images)<1 || count($images)>5) { http_response_code(422); exit('Provide between 1 and 5 product photos.'); }
    db()->prepare('UPDATE Product SET images=?,updatedAt=NOW(3) WHERE id=?')->execute([json_encode($images,JSON_UNESCAPED_SLASHES),$id]); redirect('/products');
}
if ($path === '/products/options' && $method === 'POST') {
    verify_csrf(); $id=trim((string)($_POST['product_id']??'')); $colors=list_values((string)($_POST['colors']??'')); $sizes=list_values((string)($_POST['sizes']??''));
    $youtubeUrl=trim((string)($_POST['youtube_url']??''));
    if($youtubeUrl!=='' && (!filter_var($youtubeUrl,FILTER_VALIDATE_URL) || !preg_match('/(^|\.)((youtube\.com)|(youtu\.be))$/i',(string)parse_url($youtubeUrl,PHP_URL_HOST)))) { http_response_code(422); exit('Enter a valid YouTube URL.'); }
    $stmt=db()->prepare('SELECT colorImages FROM Product WHERE id=?'); $stmt->execute([$id]); $current=$stmt->fetchColumn(); $map=$current?json_decode((string)$current,true):[]; if(!is_array($map))$map=[];
    $colorName=trim((string)($_POST['color_name']??'')); $colorUpload=uploaded_product_images($_FILES['color_image_file']??null,1);
    if($colorName!=='' && $colorUpload) { $map[$colorName]=$colorUpload[0]; if(!in_array($colorName,$colors,true))$colors[]=$colorName; }
    db()->prepare('UPDATE Product SET colors=?,sizes=?,colorImages=?,youtubeUrl=?,position=?,updatedAt=NOW(3) WHERE id=?')->execute([json_encode($colors),json_encode($sizes),json_encode($map,JSON_UNESCAPED_SLASHES),$youtubeUrl?:null,max(0,(int)($_POST['position']??0)),$id]); redirect('/products');
}
if ($path === '/categories/ranking' && $method === 'POST') {
    verify_csrf(); db()->prepare('UPDATE Category SET position=?,updatedAt=NOW(3) WHERE id=?')->execute([max(0,(int)($_POST['position']??0)),(string)$_POST['category_id']]); redirect('/categories');
}
if ($path === '/products/ranking' && $method === 'POST') {
    verify_csrf();
    $id = trim((string)($_POST['product_id'] ?? ''));
    $position = max(0, (int)($_POST['position'] ?? 0));
    if ($id !== '') {
        db()->prepare('UPDATE Product SET position=?, updatedAt=NOW(3) WHERE id=?')->execute([$position, $id]);
        flash_set('success', 'Storefront ranking position updated.');
    }
    redirect('/products');
}
if ($path === '/products/bestseller' && $method === 'POST') {
    verify_csrf();
    $id = trim((string)($_POST['product_id'] ?? ''));
    if ($id !== '') {
        $stmt = db()->prepare('SELECT isFeatured FROM Product WHERE id=?');
        $stmt->execute([$id]);
        $current = (int)$stmt->fetchColumn();
        $next = $current ? 0 : 1;
        db()->prepare('UPDATE Product SET isFeatured=?, updatedAt=NOW(3) WHERE id=?')->execute([$next, $id]);
        flash_set('success', $next ? 'Added to Best Sellers.' : 'Removed from Best Sellers.');
    }
    redirect('/products');
}
if ($path === '/categories/update' && $method === 'POST') {
    verify_csrf();
    $id=trim((string)($_POST['category_id']??'')); $name=trim((string)($_POST['name']??'')); $image=category_image($_FILES['image_file']??null,'');
    if($id==='' || strlen($name)<2) { http_response_code(422); exit('A valid category is required.'); }
    if($image===null) db()->prepare('UPDATE Category SET name=?,active=?,updatedAt=NOW(3) WHERE id=?')->execute([$name,isset($_POST['active'])?1:0,$id]);
    else db()->prepare('UPDATE Category SET name=?,image=?,active=?,updatedAt=NOW(3) WHERE id=?')->execute([$name,$image,isset($_POST['active'])?1:0,$id]);
    flash_set('success', 'Category updated successfully.');
    redirect('/categories');
}
if ($path === '/categories/create' && $method === 'POST') {
    verify_csrf();
    $name=trim((string)($_POST['name']??'')); $slug=slugify((string)($_POST['slug']?:$name)); $parent=trim((string)($_POST['parent_id']??''))?:null;
    if(strlen($name)<2 || $slug==='') { http_response_code(422); exit('Category name is required.'); }
    $image=category_image($_FILES['image_file']??null,'');
    try {
        db()->prepare('INSERT INTO Category (id,name,slug,description,image,parentId,active,createdAt,updatedAt) VALUES (?,?,?,?,?,?,1,NOW(3),NOW(3))')->execute(['php_'.bin2hex(random_bytes(12)),$name,$slug,trim((string)($_POST['description']??''))?:null,$image,$parent]);
        flash_set('success', "Category '$name' created successfully.");
    } catch(PDOException $error) {
        http_response_code(422); exit($error->getCode()==='23000'?'That category slug already exists.':'Unable to create category.');
    }
    redirect('/categories');
}
if ($path === '/products/create' && $method === 'POST') {
    verify_csrf();
    $name=trim((string)($_POST['name']??'')); $slug=slugify((string)($_POST['slug']?:$name)); $price=filter_var($_POST['price']??null,FILTER_VALIDATE_INT); $stock=filter_var($_POST['stock']??null,FILTER_VALIDATE_INT);
    $compareRaw=trim((string)($_POST['compare_at']??'')); $compareAt=$compareRaw===''?null:filter_var($compareRaw,FILTER_VALIDATE_INT);
    $youtubeUrl=trim((string)($_POST['youtube_url']??''));
    $position=max(0, (int)($_POST['position'] ?? 0));
    $colors=list_values((string)($_POST['colors'] ?? ''));
    $sizes=list_values((string)($_POST['sizes'] ?? ''));

    $uploads = uploaded_product_images($_FILES['image_files'] ?? null);
    $gallerySelected = isset($_POST['gallery_selected']) && is_array($_POST['gallery_selected']) ? array_filter(array_map('trim', $_POST['gallery_selected'])) : [];
    $rawUrls = trim((string)($_POST['image_urls'] ?? $_POST['images'] ?? ''));
    $urlList = array_values(array_filter(array_map('trim', preg_split('/[\r\n,]+/', $rawUrls) ?: [])));
    $images = array_values(array_unique(array_merge($gallerySelected, $uploads, $urlList)));
    if (!$images) {
        $images = ['/images/monimala-hero.png'];
    }

    if($youtubeUrl!=='' && (!filter_var($youtubeUrl,FILTER_VALIDATE_URL) || !preg_match('/(^|\.)((youtube\.com)|(youtu\.be))$/i',(string)parse_url($youtubeUrl,PHP_URL_HOST)))) {
        flash_set('error', 'Enter a valid YouTube URL.');
        redirect('/products');
    }
    if(strlen($name)<2 || $slug==='' || $price===false || $price<0 || $stock===false || $stock<0 || empty($_POST['category_id']) || empty($_POST['sku'])) {
        flash_set('error', 'Complete every required product field with valid values.');
        redirect('/products');
    }
    $id='php_'.bin2hex(random_bytes(12)); $pdo=db(); $pdo->beginTransaction();
    try {
        $pdo->prepare('INSERT INTO Product (id,name,slug,description,price,compareAt,stock,sku,images,youtubeUrl,metal,occasion,colors,sizes,position,isFeatured,isNew,categoryId,active,lowStockAt,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(3),NOW(3))')->execute([$id,$name,$slug,trim((string)$_POST['description']),$price,$compareAt,$stock,strtoupper(trim((string)$_POST['sku'])),json_encode($images,JSON_UNESCAPED_SLASHES),$youtubeUrl?:null,trim((string)$_POST['metal'])?:null,trim((string)$_POST['occasion'])?:null,json_encode($colors),json_encode($sizes),$position,isset($_POST['featured'])?1:0,isset($_POST['is_new'])?1:0,$_POST['category_id'],1,max(0,(int)($_POST['low_stock_at']??5))]);
        if($stock>0) $pdo->prepare('INSERT INTO InventoryMovement (id,productId,actorId,quantity,reason,reference,createdAt) VALUES (?,?,?,?,?,?,NOW(3))')->execute(['php_'.bin2hex(random_bytes(12)),$id,admin()['id'],$stock,'OPENING_STOCK','Product creation']);
        $pdo->commit();
        flash_set('success', "Product '$name' created successfully with ".count($images)." image".(count($images)===1?'':'s').".");
    } catch(Throwable $error) {
        $pdo->rollBack();
        flash_set('error', 'SKU or slug already exists, or the category is invalid.');
    }
    redirect('/products');
}

layout_start(match($path){
    '/categories'=>'Categories',
    '/products'=>'Products',
    '/products/edit'=>'Edit product',
    '/inventory'=>'Inventory',
    '/orders'=>'Orders',
    '/customers'=>'Customers',
    '/coupons'=>'Coupons',
    default=>'Dashboard'
}, $path);

if($path==='/categories') { categories_page(); category_ranking_page(); }
elseif($path==='/products') { products_page_v2(); bestseller_ranking_page(); product_advanced_page(); }
elseif($path==='/products/edit') product_edit_page();
elseif($path==='/inventory') { inventory_page(); inventory_movements_page(); }
elseif($path==='/orders') orders_page();
elseif($path==='/customers') customers_page();
elseif($path==='/coupons') coupons_page();
else dashboard_page();

layout_end();

function login_page(string $error=''): void { ?><!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Admin Login</title><link rel="stylesheet" href="/assets/admin.css"></head><body class="login"><form method="post" class="login-card"><h1>Monimala Admin</h1><p>Authorised staff only</p><?php if($error):?><div class="error"><?=e($error)?></div><?php endif?><input type="hidden" name="_token" value="<?=csrf_token()?>"><label>Email<input name="email" type="email" required autocomplete="username"></label><label>Password<input name="password" type="password" required autocomplete="current-password"></label><button>Secure sign in</button></form></body></html><?php }

function layout_start(string $title, string $currentPath = '/'): void {
    $flash = flash_get();
    $nav = [
        '/' => 'Dashboard',
        '/orders' => 'Orders',
        '/products' => 'Products',
        '/inventory' => 'Inventory',
        '/customers' => 'Customers',
        '/coupons' => 'Coupons',
        '/categories' => 'Categories'
    ];
?><!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title><?=e($title)?> · Monimala Commerce</title><link rel="stylesheet" href="/assets/admin.css"></head><body><aside><div><h1>Monimala</h1><p>Commerce Control</p></div><nav><?php foreach($nav as $href => $label): $active = ($currentPath === $href) || ($href !== '/' && str_starts_with($currentPath, $href)); ?><a href="<?=$href?>" class="<?=$active?'active':''?>"><?=e($label)?></a><?php endforeach; ?></nav><form method="post" action="/logout"><input type="hidden" name="_token" value="<?=csrf_token()?>"><button class="sign-out-btn">Sign out</button></form></aside><main><header><div><small>MONIMALA COMMERCE CONTROL</small><h2><?=e($title)?></h2></div><div class="user-pill"><span><?=e(admin()['name'])?></span><small><?=e(admin()['email'])?></small></div></header><?php if($flash):?><div class="flash flash-<?=e($flash['type'])?>"><?=e($flash['message'])?></div><?php endif; }
function layout_end(): void { ?>
</main>
<script>
function selectMediaTab(btn, panelId) {
    const desk = btn.closest('.product-media-desk');
    if (!desk) return;
    desk.querySelectorAll('.media-tab-btn').forEach(b => b.classList.remove('active'));
    desk.querySelectorAll('.media-tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.add('active');
}

function toggleGalleryImage(item, url, formId) {
    item.classList.toggle('selected');
    const isSelected = item.classList.contains('selected');
    const tray = document.getElementById('tray-' + formId);
    const inputs = document.getElementById('gallery-inputs-' + formId);
    const countEl = document.getElementById('count-' + formId);
    if (!tray || !inputs) return;

    let existingInput = Array.from(inputs.querySelectorAll('input')).find(i => i.value === url);
    if (isSelected) {
        if (!existingInput) {
            const inp = document.createElement('input');
            inp.type = 'hidden';
            inp.name = 'gallery_selected[]';
            inp.value = url;
            inputs.appendChild(inp);

            const card = document.createElement('div');
            card.className = 'preview-card';
            card.dataset.url = url;
            const cardId = 'card-' + formId + '-' + Math.random().toString(36).substr(2, 8);
            card.id = cardId;
            card.innerHTML = `<img src="${url}" alt=""><button type="button" class="preview-card-remove" onclick="removeAttachedImage('${cardId}', '${url}', '${formId}')">✕</button>`;
            tray.appendChild(card);
        }
    } else {
        if (existingInput) existingInput.remove();
        const card = Array.from(tray.querySelectorAll('.preview-card')).find(c => c.dataset.url === url || c.querySelector('input')?.value === url);
        if (card) card.remove();
    }
    if (countEl) countEl.innerText = tray.querySelectorAll('.preview-card').length;
}

function removeAttachedImage(cardId, url, formId) {
    const card = document.getElementById(cardId) || document.querySelector(`[data-url="${url}"]`);
    if (card) card.remove();
    
    const gallery = document.getElementById('tab-gallery-' + formId);
    if (gallery) {
        gallery.querySelectorAll('.gallery-thumb-item').forEach(gi => {
            if (gi.dataset.url === url || gi.querySelector('img')?.src === url) {
                gi.classList.remove('selected');
            }
        });
    }

    const inputs = document.getElementById('gallery-inputs-' + formId);
    if (inputs) {
        inputs.querySelectorAll('input').forEach(i => {
            if (i.value === url) i.remove();
        });
    }

    const countEl = document.getElementById('count-' + formId);
    const tray = document.getElementById('tray-' + formId);
    if (countEl && tray) countEl.innerText = tray.querySelectorAll('.preview-card').length;
}

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * Client-Side Hybrid Image Compressor
 * Resizes down to maxDimension (1600px) and encodes to WebP at 82% quality.
 */
async function compressImageToWebP(file, maxDimension = 1600, quality = 0.82) {
    return new Promise((resolve) => {
        if (!window.FileReader || !window.Image || !document.createElement('canvas').toBlob) {
            return resolve({ file, originalSize: file.size, compressedSize: file.size, savedPercent: 0, dataUrl: null });
        }
        const reader = new FileReader();
        reader.onerror = () => resolve({ file, originalSize: file.size, compressedSize: file.size, savedPercent: 0, dataUrl: null });
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => resolve({ file, originalSize: file.size, compressedSize: file.size, savedPercent: 0, dataUrl: null });
            img.onload = () => {
                let width = img.naturalWidth || img.width;
                let height = img.naturalHeight || img.height;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve({ file, originalSize: file.size, compressedSize: file.size, savedPercent: 0, dataUrl: null });
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) return resolve({ file, originalSize: file.size, compressedSize: file.size, savedPercent: 0, dataUrl: null });
                    const cleanBase = file.name.replace(/\.[^/.]+$/, '');
                    const webpFile = new File([blob], cleanBase + '.webp', {
                        type: 'image/webp',
                        lastModified: Date.now()
                    });
                    const origSize = file.size;
                    const compSize = webpFile.size;
                    const saved = origSize > compSize ? Math.round(((origSize - compSize) / origSize) * 100) : 0;
                    const dataUrl = canvas.toDataURL('image/webp', quality);
                    resolve({ file: webpFile, originalSize: origSize, compressedSize: compSize, savedPercent: saved, dataUrl });
                }, 'image/webp', quality);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Keep track of files per formId for cumulative addition & removal
window._uploadedFilesMap = window._uploadedFilesMap || {};

async function handleFilePreview(input, formId) {
    const previewDiv = document.getElementById('upload-preview-' + formId);
    if (!previewDiv || !input.files || input.files.length === 0) return;

    previewDiv.innerHTML = '<div style="padding:10px;font-size:12px;color:#8f2d3e;font-weight:600;">⚡ Optimizing & compressing photos to WebP...</div>';

    window._uploadedFilesMap[formId] = window._uploadedFilesMap[formId] || [];
    const newFiles = Array.from(input.files);

    for (let i = 0; i < newFiles.length; i++) {
        const rawFile = newFiles[i];
        try {
            const res = await compressImageToWebP(rawFile, 1600, 0.82);
            window._uploadedFilesMap[formId].push({
                file: res.file,
                name: res.file.name,
                origSize: res.originalSize,
                compSize: res.compressedSize,
                saved: res.savedPercent,
                src: res.dataUrl || URL.createObjectURL(res.file)
            });
        } catch {
            window._uploadedFilesMap[formId].push({
                file: rawFile,
                name: rawFile.name,
                origSize: rawFile.size,
                compSize: rawFile.size,
                saved: 0,
                src: URL.createObjectURL(rawFile)
            });
        }
    }

    syncUploadedFiles(input, formId);
}

function removeUploadedFile(formId, index) {
    if (!window._uploadedFilesMap[formId]) return;
    window._uploadedFilesMap[formId].splice(index, 1);
    const dropzone = document.getElementById('tab-upload-' + formId);
    const input = dropzone ? dropzone.querySelector('input[type="file"]') : null;
    syncUploadedFiles(input, formId);
}

function syncUploadedFiles(input, formId) {
    const previewDiv = document.getElementById('upload-preview-' + formId);
    const list = window._uploadedFilesMap[formId] || [];

    if (input && window.DataTransfer) {
        const dt = new DataTransfer();
        list.forEach(item => dt.items.add(item.file));
        input.files = dt.files;
    }

    if (!previewDiv) return;
    previewDiv.innerHTML = '';

    list.forEach((c, idx) => {
        const card = document.createElement('div');
        card.className = 'preview-card';
        card.style.position = 'relative';
        const badgeText = c.saved > 0
            ? `⚡ WebP • ${formatBytes(c.compSize)} (-${c.saved}%)`
            : `WebP • ${formatBytes(c.compSize)}`;
        card.innerHTML = `
            <img src="${c.src}" alt="${c.name}">
            <button type="button" class="preview-card-remove" onclick="removeUploadedFile('${formId}', ${idx})" title="Remove photo" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.7);color:#fff;border:none;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">✕</button>
            <span style="position:absolute;bottom:0;left:0;right:0;background:rgba(8,116,67,0.92);color:#fff;font-size:9px;font-weight:700;text-align:center;padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${formatBytes(c.origSize)} ➔ ${formatBytes(c.compSize)}">
                ${badgeText}
            </span>
        `;
        previewDiv.appendChild(card);
    });

    if (list.length > 0) {
        const addMore = document.createElement('button');
        addMore.type = 'button';
        addMore.className = 'button-secondary';
        addMore.style.cssText = 'grid-column:1/-1;margin-top:8px;font-size:12px;padding:6px 12px;display:inline-flex;align-items:center;gap:5px;width:fit-content;';
        addMore.innerHTML = '📁 Add More Photos';
        addMore.onclick = () => {
            const dropzone = document.getElementById('tab-upload-' + formId);
            const inp = dropzone ? dropzone.querySelector('input[type="file"]') : null;
            if (inp) inp.click();
        };
        previewDiv.appendChild(addMore);
    }
}

// Category icon client-side auto-compression listener
document.addEventListener('change', async (e) => {
    if (e.target && e.target.name === 'image_file' && e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
            const res = await compressImageToWebP(file, 800, 0.85);
            if (window.DataTransfer && res.file) {
                const dt = new DataTransfer();
                dt.items.add(res.file);
                e.target.files = dt.files;
            }
        } catch {}
    }
});
</script>
</body></html><?php }
function dashboard_page(): void {
    $pdo=db();
    $stats=[
        'Active Products'=>$pdo->query('SELECT COUNT(*) FROM Product WHERE active=1')->fetchColumn(),
        'Low Stock Alerts'=>$pdo->query('SELECT COUNT(*) FROM Product WHERE active=1 AND stock<=lowStockAt')->fetchColumn(),
        'Open Orders'=>$pdo->query("SELECT COUNT(*) FROM `Order` WHERE status NOT IN ('DELIVERED','CANCELLED')")->fetchColumn(),
        'Paid Revenue'=>'₹'.number_format((int)$pdo->query("SELECT COALESCE(SUM(total),0) FROM `Order` WHERE paymentStatus='PAID'")->fetchColumn()),
        'Customers'=>$pdo->query("SELECT COUNT(*) FROM User WHERE role='CUSTOMER'")->fetchColumn()
    ];
    echo '<section class="stats stats-5">';
    foreach($stats as $label=>$value) echo '<article><small>'.e($label).'</small><strong>'.e($value).'</strong></article>';
    echo '</section>';

    $recentOrders = $pdo->query("SELECT id, trackingCode, email, total, status, paymentStatus, createdAt FROM `Order` ORDER BY createdAt DESC LIMIT 6")->fetchAll();
    $lowProducts = $pdo->query("SELECT id, name, sku, stock, lowStockAt FROM Product WHERE active=1 AND stock <= lowStockAt ORDER BY stock ASC LIMIT 6")->fetchAll();
    ?>
    <div class="dashboard-grid">
        <section class="panel">
            <div class="panel-heading">
                <div>
                    <h3>Recent Store Orders</h3>
                    <p>Latest online orders and payments</p>
                </div>
                <a class="button-secondary" href="/orders">View all orders &rarr;</a>
            </div>
            <table>
                <thead>
                    <tr><th>Reference</th><th>Customer</th><th>Total</th><th>Status</th></tr>
                </thead>
                <tbody>
                    <?php foreach ($recentOrders as $order): ?>
                        <tr>
                            <td><a href="/orders#order-<?=e($order['id'])?>"><strong><?=e($order['trackingCode'])?></strong></a><small><?=e(date('M j, H:i', strtotime($order['createdAt'])))?></small></td>
                            <td><?=e($order['email'])?></td>
                            <td><strong>₹<?=number_format((int)$order['total'])?></strong></td>
                            <td><span class="status-badge status-<?=strtolower(e($order['status']))?>"><?=e($order['status'])?></span></td>
                        </tr>
                    <?php endforeach; ?>
                    <?php if (!$recentOrders): ?>
                        <tr><td colSpan="4" class="empty-state">No orders received yet.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </section>

        <section class="panel">
            <div class="panel-heading">
                <div>
                    <h3>Low Stock Alerts</h3>
                    <p>Products requiring replenishment</p>
                </div>
                <a class="button-secondary" href="/inventory">Inventory &rarr;</a>
            </div>
            <div class="low-stock-list">
                <?php foreach ($lowProducts as $lp): ?>
                    <div class="low-stock-item">
                        <div>
                            <strong><?=e($lp['name'])?></strong>
                            <small>SKU: <?=e($lp['sku'])?></small>
                        </div>
                        <span class="stock-danger-pill"><?=e($lp['stock'])?> left</span>
                    </div>
                <?php endforeach; ?>
                <?php if (!$lowProducts): ?>
                    <p class="empty-state">All inventory levels are healthy.</p>
                <?php endif; ?>
            </div>
        </section>
    </div>
    <?php
}
function list_values(string $value): array { return array_values(array_unique(array_filter(array_map('trim',preg_split('/[\r\n,]+/',$value)?:[])))); }

/**
 * Hybrid Image Optimizer & WebP Compressor (Server-Side Safety Net)
 * - Auto-detects JPEG, PNG, WebP, GIF.
 * - Handles EXIF auto-rotation for phone cameras.
 * - Preserves transparent alpha channel for PNG/WebP jewelry assets.
 * - Downsamples to maxDimension (e.g. 1600px) with bicubic interpolation.
 * - Compresses to tuned WebP format (quality 82-85) to cut file size by 85-95%.
 */
function convert_and_compress_to_webp(string $sourcePath, string $destPath, int $maxDimension = 1600, int $quality = 82): bool {
    if (!file_exists($sourcePath)) return false;

    // Check if GD WebP creation is supported
    if (!function_exists('imagewebp') || !function_exists('imagecreatetruecolor')) {
        return copy($sourcePath, $destPath);
    }

    $info = @getimagesize($sourcePath);
    if (!$info) return copy($sourcePath, $destPath);

    $mime = $info['mime'] ?? '';
    $srcW = $info[0] ?? 0;
    $srcH = $info[1] ?? 0;
    if ($srcW <= 0 || $srcH <= 0) return copy($sourcePath, $destPath);

    $srcImg = null;
    switch ($mime) {
        case 'image/jpeg':
            $srcImg = @imagecreatefromjpeg($sourcePath);
            break;
        case 'image/png':
            $srcImg = @imagecreatefrompng($sourcePath);
            break;
        case 'image/webp':
            $srcImg = @imagecreatefromwebp($sourcePath);
            break;
        case 'image/gif':
            $srcImg = @imagecreatefromgif($sourcePath);
            break;
        default:
            return copy($sourcePath, $destPath);
    }

    if (!$srcImg) return copy($sourcePath, $destPath);

    // Fix EXIF orientation for phone camera JPEGs
    if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
        $exif = @exif_read_data($sourcePath);
        if ($exif && !empty($exif['Orientation'])) {
            switch ((int)$exif['Orientation']) {
                case 3:
                    $rotated = @imagerotate($srcImg, 180, 0);
                    if ($rotated) { imagedestroy($srcImg); $srcImg = $rotated; }
                    break;
                case 6:
                    $rotated = @imagerotate($srcImg, -90, 0);
                    if ($rotated) { imagedestroy($srcImg); $srcImg = $rotated; $tmp = $srcW; $srcW = $srcH; $srcH = $tmp; }
                    break;
                case 8:
                    $rotated = @imagerotate($srcImg, 90, 0);
                    if ($rotated) { imagedestroy($srcImg); $srcImg = $rotated; $tmp = $srcW; $srcW = $srcH; $srcH = $tmp; }
                    break;
            }
        }
    }

    // Determine target dimensions maintaining aspect ratio
    $dstW = $srcW;
    $dstH = $srcH;
    if ($dstW > $maxDimension || $dstH > $maxDimension) {
        if ($dstW > $dstH) {
            $dstH = (int)round(($dstH * $maxDimension) / $dstW);
            $dstW = $maxDimension;
        } else {
            $dstW = (int)round(($dstW * $maxDimension) / $dstH);
            $dstH = $maxDimension;
        }
    }

    $dstImg = imagecreatetruecolor($dstW, $dstH);
    if (!$dstImg) {
        imagedestroy($srcImg);
        return copy($sourcePath, $destPath);
    }

    // Preserve alpha transparency for PNG / WebP jewelry cutouts
    imagealphablending($dstImg, false);
    imagesavealpha($dstImg, true);
    $transparent = imagecolorallocatealpha($dstImg, 255, 255, 255, 127);
    imagefilledrectangle($dstImg, 0, 0, $dstW, $dstH, $transparent);

    // High quality bicubic resampling
    imagecopyresampled($dstImg, $srcImg, 0, 0, 0, 0, $dstW, $dstH, $srcW, $srcH);

    // Save as WebP
    $saved = @imagewebp($dstImg, $destPath, $quality);

    imagedestroy($srcImg);
    imagedestroy($dstImg);

    return $saved ?: copy($sourcePath, $destPath);
}

function uploaded_product_images(?array $files, int $limit = 10): array {
    if (!$files || !isset($files['name'])) return [];
    $names = is_array($files['name']) ? $files['name'] : [$files['name']];
    $results = [];
    $directory = __DIR__ . '/uploads/products';
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        http_response_code(500); exit('Upload directory unavailable.');
    }
    $appUrl = rtrim((string)env_value('APP_URL', 'https://lightskyblue-swan-841286.hostingersite.com'), '/');

    foreach ($names as $index => $name) {
        $error = is_array($files['error']) ? $files['error'][$index] : $files['error'];
        if ($error === UPLOAD_ERR_NO_FILE) continue;
        $size = is_array($files['size']) ? $files['size'][$index] : $files['size'];
        $tmp = is_array($files['tmp_name']) ? $files['tmp_name'][$index] : $files['tmp_name'];

        if ($error !== UPLOAD_ERR_OK || $size > 15728640) { // Up to 15 MB allowed for raw mobile photos
            http_response_code(422); exit('Each product photo must be under 15 MB.');
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmp);
        $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!in_array($mime, $allowed, true)) {
            http_response_code(422); exit('Product photos must be JPG, PNG or WebP.');
        }

        $filename = bin2hex(random_bytes(12)) . '.webp';
        $destPath = $directory . '/' . $filename;

        // Auto-compress and convert to WebP (max 1600px, 82% quality)
        if (!convert_and_compress_to_webp($tmp, $destPath, 1600, 82)) {
            http_response_code(500); exit('Unable to optimize and save product photo.');
        }

        $results[] = $appUrl . '/uploads/products/' . $filename;
        if (count($results) > $limit) {
            http_response_code(422); exit('Too many product photos.');
        }
    }
    return $results;
}

function slugify(string $value): string { $value=strtolower(trim($value)); $value=preg_replace('/[^a-z0-9]+/','-',$value)??''; return trim($value,'-'); }

function category_image(?array $file, string $url): ?string {
    if ($file && ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK || ($file['size'] ?? 0) > 10485760) {
            http_response_code(422); exit('Image upload failed or exceeds 10 MB.');
        }
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!in_array($mime, $allowed, true)) {
            http_response_code(422); exit('Use a JPG, PNG or WebP image.');
        }
        $directory = __DIR__ . '/uploads/categories';
        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            http_response_code(500); exit('Upload directory is unavailable.');
        }
        $filename = bin2hex(random_bytes(12)) . '.webp';
        $destPath = $directory . '/' . $filename;

        // Auto-compress category icon to WebP (max 800px, 85% quality)
        if (!convert_and_compress_to_webp($file['tmp_name'], $destPath, 800, 85)) {
            http_response_code(500); exit('Unable to optimize and save category image.');
        }

        $appUrl = rtrim((string)env_value('APP_URL', 'https://lightskyblue-swan-841286.hostingersite.com'), '/');
        return $appUrl . '/uploads/categories/' . $filename;
    }
    if ($url === '') return null;
    if (!str_starts_with($url, '/') && !filter_var($url, FILTER_VALIDATE_URL)) {
        http_response_code(422); exit('Enter a valid image URL.');
    }
    return $url;
}

function categories_page(): void { $items=db()->query('SELECT c.id,c.name,c.slug,c.image,c.active,p.name parent FROM Category c LEFT JOIN Category p ON p.id=c.parentId ORDER BY c.parentId IS NOT NULL,c.createdAt,c.name')->fetchAll(); ?><section class="panel"><h3>Create category or subcategory</h3><form method="post" action="/categories/create" enctype="multipart/form-data" class="form-grid"><input type="hidden" name="_token" value="<?=csrf_token()?>"><label>Name<input name="name" required placeholder="e.g. Traditional Necklaces"></label><label>Slug (optional)<input name="slug" placeholder="traditional-necklaces"></label><label>Parent category<select name="parent_id"><option value="">Top-level category</option><?php foreach($items as $item):?><option value="<?=e($item['id'])?>"><?=e(($item['parent']?$item['parent'].' → ':'').$item['name'])?></option><?php endforeach?></select></label><label>Category Photo / Icon (Auto WebP)<input name="image_file" type="file" accept="image/jpeg,image/png,image/webp"></label><label class="wide">Description<textarea name="description" placeholder="Heritage craftsmanship background..."></textarea></label><button>Create category</button></form></section><section class="panel"><h3>Category icons</h3><p>Upload a square PNG, JPG, or WebP photo directly from your device. It is automatically compressed to optimized WebP in hybrid mode and appears immediately.</p><table><thead><tr><th>Icon</th><th>Category</th><th>Parent</th><th>Direct Photo Upload & Update</th></tr></thead><tbody><?php foreach($items as $item):?><tr><td><?php if($item['image']):?><img class="category-thumb" src="<?=e($item['image'])?>" alt=""><?php else:?><span>No icon</span><?php endif?></td><td><strong><?=e($item['name'])?></strong><small><?=e($item['slug'])?></small></td><td><?=e($item['parent']?:'Top level')?></td><td><form method="post" action="/categories/update" enctype="multipart/form-data" class="category-edit"><input type="hidden" name="_token" value="<?=csrf_token()?>"><input type="hidden" name="category_id" value="<?=e($item['id'])?>"><input name="name" value="<?=e($item['name'])?>" required aria-label="Category name"><input name="image_file" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" aria-label="Upload category icon"><label><input name="active" type="checkbox" <?=$item['active']?'checked':''?>> Active</label><button>Save</button></form><form method="post" action="/categories/delete" style="display:inline-block; margin-left:8px;" onsubmit="return confirm('Permanently delete category <?=e(addslashes($item['name']))?>?');"><input type="hidden" name="_token" value="<?=csrf_token()?>"><input type="hidden" name="category_id" value="<?=e($item['id'])?>"><button class="btn-action-delete" type="submit">🗑 Delete</button></form></td></tr><?php endforeach?></tbody></table></section><?php }

function products_page(): void { $items=db()->query('SELECT p.id,p.sku,p.name,p.price,p.lowStockAt,p.active,c.name category FROM Product p JOIN Category c ON c.id=p.categoryId ORDER BY p.updatedAt DESC')->fetchAll(); $categories=db()->query('SELECT id,name FROM Category WHERE active=1 ORDER BY name')->fetchAll(); ?><section class="panel"><h3>Create product</h3><form method="post" action="/products/create" class="form-grid"><input type="hidden" name="_token" value="<?=csrf_token()?>"><label>Name<input name="name" required></label><label>Slug (optional)<input name="slug"></label><label>SKU<input name="sku" required></label><label>Category<select name="category_id" required><option value="">Select category</option><?php foreach($categories as $category):?><option value="<?=e($category['id'])?>"><?=e($category['name'])?></option><?php endforeach?></select></label><label>Price in ₹<input name="price" type="number" min="0" required></label><label>Opening stock<input name="stock" type="number" min="0" value="0" required></label><label>Low-stock alert<input name="low_stock_at" type="number" min="0" value="5" required></label><label>Metal/finish<input name="metal"></label><label>Occasion<input name="occasion"></label><label class="wide">YouTube product video URL (optional)<input name="youtube_url" type="url" placeholder="https://www.youtube.com/watch?v=..."></label><label class="wide">Image URLs (one per line)<textarea name="images" required></textarea></label><label class="wide">Description<textarea name="description" required></textarea></label><label><input type="checkbox" name="featured"> Featured</label><label><input type="checkbox" name="is_new"> New arrival</label><button>Create product</button></form></section><section class="panel"><h3>Product controls</h3><table><thead><tr><th>Product</th><th>Category</th><th>Commercial settings</th></tr></thead><tbody><?php foreach($items as $item):?><tr><td><strong><?=e($item['name'])?></strong><small><?=e($item['sku'])?></small></td><td><?=e($item['category'])?></td><td><form method="post" action="/products/update" class="inline"><input type="hidden" name="_token" value="<?=csrf_token()?>"><input type="hidden" name="product_id" value="<?=e($item['id'])?>"><input name="price" type="number" min="0" value="<?=e($item['price'])?>" required aria-label="Price"><input name="low_stock_at" type="number" min="0" value="<?=e($item['lowStockAt'])?>" required aria-label="Low stock threshold"><label><input name="active" type="checkbox" <?=$item['active']?'checked':''?>> Active</label><button>Save</button></form><form method="post" action="/products/delete" style="display:inline-block; margin-left:8px;" onsubmit="return confirm('Permanently delete product <?=e(addslashes($item['name']))?>?');"><input type="hidden" name="_token" value="<?=csrf_token()?>"><input type="hidden" name="product_id" value="<?=e($item['id'])?>"><button class="btn-action-delete" type="submit">🗑 Delete</button></form></td></tr><?php endforeach?></tbody></table></section><?php }

function available_media_gallery(): array {
    $results = [];
    $uploadDir = __DIR__ . '/uploads/products';
    if (is_dir($uploadDir)) {
        $files = scandir($uploadDir);
        foreach ($files as $f) {
            if ($f === '.' || $f === '..') continue;
            $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
                $results[] = rtrim((string)env_value('APP_URL', 'https://lightskyblue-swan-841286.hostingersite.com'), '/') . '/uploads/products/' . $f;
            }
        }
    }
    try {
        $existing = db()->query("SELECT images FROM Product WHERE images IS NOT NULL")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($existing as $imgJson) {
            $arr = json_decode((string)$imgJson, true);
            if (is_array($arr)) {
                foreach ($arr as $url) {
                    if (is_string($url) && strlen($url) > 5 && !in_array($url, $results, true)) {
                        $results[] = $url;
                    }
                }
            }
        }
    } catch (Throwable) {}
    return $results;
}

function render_media_desk(array $currentImages, string $formId): void {
    $gallery = available_media_gallery();
    ?>
    <div class="product-media-desk">
        <h4>Product Imagery & Media Gallery</h4>
        <p>Choose from your store gallery, upload new photos directly from your device, or paste external image URLs. All methods can be used together.</p>

        <div class="media-tabs">
            <button type="button" class="media-tab-btn active" onclick="selectMediaTab(this, 'tab-gallery-<?=$formId?>')">🖼️ Store Media Gallery</button>
            <button type="button" class="media-tab-btn" onclick="selectMediaTab(this, 'tab-upload-<?=$formId?>')">📁 Upload from Device</button>
            <button type="button" class="media-tab-btn" onclick="selectMediaTab(this, 'tab-urls-<?=$formId?>')">🔗 Add by URL</button>
        </div>

        <div id="tab-gallery-<?=$formId?>" class="media-tab-panel active">
            <div class="gallery-selector-container">
                <div class="gallery-selector-grid">
                    <?php foreach ($gallery as $gUrl): 
                        $isSelected = in_array($gUrl, $currentImages, true);
                    ?>
                        <div class="gallery-thumb-item <?=$isSelected?'selected':''?>" data-url="<?=e($gUrl)?>" onclick="toggleGalleryImage(this, '<?=e($gUrl)?>', '<?=$formId?>')">
                            <img src="<?=e($gUrl)?>" alt="Gallery item" loading="lazy">
                            <span class="gallery-check-badge">✓</span>
                        </div>
                    <?php endforeach; ?>
                    <?php if (!$gallery): ?>
                        <p style="grid-column:1/-1;color:#888;font-size:12px;padding:10px;">No gallery images uploaded yet. Upload photos in the "Upload from Device" tab!</p>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <div id="tab-upload-<?=$formId?>" class="media-tab-panel">
            <label class="media-dropzone">
                <input type="file" name="image_files[]" multiple accept="image/jpeg,image/png,image/webp" onchange="handleFilePreview(this, '<?=$formId?>')">
                <div class="media-dropzone-inner">
                    <strong>📁 Click or drag photos here to upload</strong>
                    <small>High resolution JPG, PNG, or WebP (up to 5 MB each)</small>
                </div>
            </label>
            <div id="upload-preview-<?=$formId?>" class="image-preview-grid" style="margin-top:12px;"></div>
        </div>

        <div id="tab-urls-<?=$formId?>" class="media-tab-panel">
            <label style="display:grid;gap:6px;">
                <span style="font-size:12px;font-weight:700;color:#611320;">Paste image URLs (one URL per line or comma-separated)</span>
                <textarea name="image_urls" id="urls-input-<?=$formId?>" placeholder="https://images.unsplash.com/...&#10;https://.../photo.jpg" rows="3" style="width:100%;"><?php 
                    $nonUploadUrls = array_filter($currentImages, fn($u) => !str_contains($u, '/uploads/products/'));
                    echo e(implode("\n", $nonUploadUrls));
                ?></textarea>
            </label>
        </div>

        <div class="image-preview-tray">
            <h5>Currently Attached Images (<span id="count-<?=$formId?>"><?=count($currentImages)?></span>)</h5>
            <div id="tray-<?=$formId?>" class="image-preview-grid">
                <?php foreach ($currentImages as $idx => $img): ?>
                    <div class="preview-card" id="card-<?=$formId?>-<?=$idx?>" data-url="<?=e($img)?>">
                        <img src="<?=e($img)?>" alt="">
                        <input type="hidden" name="existing_images[]" value="<?=e($img)?>">
                        <button type="button" class="preview-card-remove" onclick="removeAttachedImage('card-<?=$formId?>-<?=$idx?>', '<?=e($img)?>', '<?=$formId?>')">✕</button>
                    </div>
                <?php endforeach; ?>
            </div>
            <div id="gallery-inputs-<?=$formId?>">
                <?php foreach ($currentImages as $img): ?>
                    <?php if (str_contains($img, '/uploads/products/')): ?>
                        <input type="hidden" name="gallery_selected[]" value="<?=e($img)?>">
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
    <?php
}

function products_page_v2(): void {
    $q=trim((string)($_GET['q']??'')); $category=trim((string)($_GET['category']??'')); $featured=trim((string)($_GET['featured']??'')); $pdo=db();
    $sql='SELECT p.id,p.sku,p.name,p.slug,p.price,p.compareAt,p.stock,p.lowStockAt,p.active,p.isFeatured,p.isNew,p.metal,p.occasion,p.images,p.position,c.name category FROM Product p JOIN Category c ON c.id=p.categoryId WHERE 1=1'; 
    $params=[];
    if($q!==''){ $sql.=' AND (p.name LIKE ? OR p.sku LIKE ?)'; $params[]='%'.$q.'%'; $params[]='%'.$q.'%'; }
    if($category!==''){ $sql.=' AND p.categoryId=?'; $params[]=$category; }
    if($featured==='1'){ $sql.=' AND p.isFeatured=1'; }
    $sql.=' ORDER BY p.position ASC, p.updatedAt DESC'; 
    $stmt=$pdo->prepare($sql); $stmt->execute($params); $items=$stmt->fetchAll();
    $categories=$pdo->query('SELECT id,name FROM Category WHERE active=1 ORDER BY name')->fetchAll();

    // Calculate Summary Metrics
    $totalCount = count($items);
    $liveCount = count(array_filter($items, fn($p) => (bool)$p['active']));
    $draftCount = $totalCount - $liveCount;
    $lowStockCount = count(array_filter($items, fn($p) => (int)$p['stock'] > 0 && (int)$p['stock'] <= (int)$p['lowStockAt']));
    $outOfStockCount = count(array_filter($items, fn($p) => (int)$p['stock'] === 0));
    $bestSellerCount = count(array_filter($items, fn($p) => (bool)$p['isFeatured']));
    ?>
    <section class="product-counter-bar">
        <div class="counter-chip">
            <small>Total Products</small>
            <strong><?=$totalCount?></strong>
        </div>
        <div class="counter-chip">
            <small>Live on Store</small>
            <strong style="color:#087443;"><?=$liveCount?></strong>
        </div>
        <div class="counter-chip">
            <small>Best Sellers</small>
            <strong style="color:#b45309;"><?=$bestSellerCount?></strong>
        </div>
        <div class="counter-chip">
            <small>Hidden / Draft</small>
            <strong style="color:#4b5563;"><?=$draftCount?></strong>
        </div>
        <div class="counter-chip <?=$lowStockCount>0?'warning':''?>">
            <small>Low Stock</small>
            <strong><?=$lowStockCount?></strong>
        </div>
        <div class="counter-chip <?=$outOfStockCount>0?'danger':''?>">
            <small>Out of Stock</small>
            <strong><?=$outOfStockCount?></strong>
        </div>
    </section>

    <section class="panel product-create">
        <details>
            <summary><strong>＋ Add a New Product</strong><span>Click to open catalog creation desk</span></summary>
            <form method="post" action="/products/create" enctype="multipart/form-data" class="form-grid" style="margin-top:16px;">
                <input type="hidden" name="_token" value="<?=csrf_token()?>">
                <label>Product Name<input name="name" required placeholder="e.g. Royal Jonbiri Bridal Necklace"></label>
                <label>Slug (URL)<input name="slug" placeholder="royal-jonbiri-necklace"></label>
                <label>Unique SKU<input name="sku" required placeholder="MONI-JB01" style="font-family:monospace;text-transform:uppercase;"></label>
                <label>Category / Collection
                    <select name="category_id" required>
                        <option value="">Select Category</option>
                        <?php foreach($categories as $cat): ?>
                            <option value="<?=e($cat['id'])?>"><?=e($cat['name'])?></option>
                        <?php endforeach; ?>
                    </select>
                </label>
                <label>Selling Price in ₹<input name="price" type="number" min="0" required placeholder="1999"></label>
                <label>Compare-At Price in ₹ (Optional)<input name="compare_at" type="number" min="0" placeholder="2499"></label>
                <label>Opening Stock<input name="stock" type="number" min="0" value="10" required></label>
                <label>Low-Stock Alert Qty<input name="low_stock_at" type="number" min="0" value="5" required></label>
                <label>Metal / Finish<input name="metal" placeholder="Gold Finish"></label>
                <label>Occasion / Theme<input name="occasion" placeholder="Bridal, Festive, Daily"></label>
                <label>Storefront Ranking Rank<input name="position" type="number" min="0" value="0" placeholder="0 (Lower shows first)"></label>
                <label class="wide">Available Colors (Comma separated)<input name="colors" placeholder="e.g. Gold, Antique Gold, Ruby Red"></label>
                <label class="wide">Available Sizes (Comma separated)<input name="sizes" placeholder="e.g. Adjustable, 2.2, 2.4, 2.6"></label>
                <label class="wide">YouTube Video URL (Optional)<input name="youtube_url" type="url" placeholder="https://www.youtube.com/watch?v=..."></label>

                <!-- Media Desk with Gallery, Upload, and URL Support -->
                <?php render_media_desk([], 'create'); ?>

                <label class="wide">Craftsmanship & Product Description<textarea name="description" required rows="3" placeholder="Detailed styling notes, dimensions, and craftsmanship..."></textarea></label>
                <label><input type="checkbox" name="featured" value="1"> ★ Mark as Featured / Best Seller</label>
                <label><input type="checkbox" name="is_new" value="1" checked> Sparkle New Arrival</label>
                
                <div class="wide form-actions" style="margin-top:10px;">
                    <button type="submit" style="padding:12px 24px;font-size:14px;">Create Product</button>
                </div>
            </form>
        </details>
    </section>

    <section class="panel">
        <div class="panel-heading">
            <div>
                <h3>Product Directory</h3>
                <p><?=$totalCount?> product<?=$totalCount===1?'':'s'?> currently in catalog</p>
            </div>
        </div>

        <form method="get" action="/products" class="catalogue-filters">
            <label>Search products<input type="search" name="q" value="<?=e($q)?>" placeholder="Search name or SKU..."></label>
            <label>Collection
                <select name="category">
                    <option value="">All Categories</option>
                    <?php foreach($categories as $cat): ?>
                        <option value="<?=e($cat['id'])?>" <?=$category===$cat['id']?'selected':''?>><?=e($cat['name'])?></option>
                    <?php endforeach; ?>
                </select>
            </label>
            <label>Curated Collection
                <select name="featured">
                    <option value="">All Products</option>
                    <option value="1" <?=$featured==='1'?'selected':''?>>★ Best Sellers Only</option>
                </select>
            </label>
            <button type="submit">Filter</button>
            <a class="button-secondary" href="/products">Reset</a>
        </form>

        <div class="product-table-card">
            <table class="product-table">
                <thead>
                    <tr>
                        <th>Product Details</th>
                        <th>Collection</th>
                        <th>Pricing</th>
                        <th>Stock Health</th>
                        <th>Rank & Best Seller</th>
                        <th>Status</th>
                        <th style="text-align:right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($items as $item): 
                        $images = json_decode((string)$item['images'], true) ?: [];
                        $thumb = !empty($images[0]) ? $images[0] : null;
                        $stock = (int)$item['stock'];
                        $lowStock = (int)$item['lowStockAt'];
                        $price = (int)$item['price'];
                        $compareAt = $item['compareAt'] !== null ? (int)$item['compareAt'] : null;
                    ?>
                        <tr>
                            <td>
                                <div class="product-cell">
                                    <div class="product-thumb-wrap">
                                        <?php if ($thumb): ?>
                                            <img src="<?=e($thumb)?>" alt="" loading="lazy">
                                        <?php else: ?>
                                            <div class="product-placeholder-wrap">No photo</div>
                                        <?php endif; ?>
                                    </div>
                                    <div class="product-info-wrap">
                                        <a class="product-title-link" href="/products/edit?id=<?=urlencode($item['id'])?>"><?=e($item['name'])?></a>
                                        <div class="product-tags">
                                            <span class="sku-badge"><?=e($item['sku'])?></span>
                                            <?php if ($item['metal']): ?>
                                                <span class="tag-pill gold"><?=e($item['metal'])?></span>
                                            <?php endif; ?>
                                            <?php if ($item['occasion']): ?>
                                                <span class="tag-pill"><?=e($item['occasion'])?></span>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <strong><?=e($item['category'])?></strong>
                            </td>
                            <td>
                                <div class="price-box">
                                    <span class="price-current">₹<?=number_format($price)?></span>
                                    <?php if ($compareAt && $compareAt > $price): ?>
                                        <span class="price-compare">₹<?=number_format($compareAt)?></span>
                                        <span class="discount-pill">-<?=round((1 - $price / $compareAt) * 100)?>%</span>
                                    <?php endif; ?>
                                </div>
                            </td>
                            <td>
                                <?php if ($stock === 0): ?>
                                    <span class="stock-pill stock-out">● Out of Stock (0)</span>
                                <?php elseif ($stock <= $lowStock): ?>
                                    <span class="stock-pill stock-low">⚠ Low Stock (<?=$stock?>)</span>
                                <?php else: ?>
                                    <span class="stock-pill stock-in">✓ In Stock (<?=$stock?>)</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <div style="display:flex;flex-direction:column;gap:5px;">
                                    <form method="post" action="/products/ranking" style="display:inline-flex;align-items:center;gap:4px;margin:0;">
                                        <input type="hidden" name="_token" value="<?=csrf_token()?>">
                                        <input type="hidden" name="product_id" value="<?=e($item['id'])?>">
                                        <span style="font-size:10px;font-weight:700;color:#6b7280;">Rank:</span>
                                        <input type="number" name="position" min="0" value="<?=e($item['position']??0)?>" style="width:55px;padding:3px 5px;font-size:12px;border:1px solid #d1d5db;border-radius:6px;text-align:center;">
                                        <button type="submit" class="button-secondary" style="padding:2px 6px;font-size:10px;font-weight:700;" title="Save ranking position">Save</button>
                                    </form>
                                    <form method="post" action="/products/bestseller" style="margin:0;">
                                        <input type="hidden" name="_token" value="<?=csrf_token()?>">
                                        <input type="hidden" name="product_id" value="<?=e($item['id'])?>">
                                        <button type="submit" style="width:100%;text-align:center;padding:3px 6px;font-size:11px;font-weight:700;border-radius:6px;cursor:pointer;border:1px solid <?=$item['isFeatured']?'#facc15':'#e5e7eb'?>;background:<?=$item['isFeatured']?'#fef08a':'#f9fafb'?>;color:<?=$item['isFeatured']?'#854d0e':'#6b7280'?>;">
                                            <?=$item['isFeatured']?'★ Best Seller':'☆ Feature'?>
                                        </button>
                                    </form>
                                </div>
                            </td>
                            <td>
                                <div>
                                    <span class="status-pill <?=$item['active']?'status-live':'status-hidden'?>">
                                        <?=$item['active']?'Live':'Hidden'?>
                                    </span>
                                    <?php if ($item['isFeatured']): ?>
                                        <div class="badge-featured" style="margin-top:2px;">★ Best Seller</div>
                                    <?php endif; ?>
                                    <?php if ($item['isNew']): ?>
                                        <div style="font-size:10px;color:#1d4ed8;font-weight:700;margin-top:2px;">New Arrival</div>
                                    <?php endif; ?>
                                </div>
                            </td>
                            <td style="text-align:right;">
                                <div class="actions-cell" style="justify-content:flex-end;">
                                    <a class="btn-action-edit" href="/products/edit?id=<?=urlencode($item['id'])?>">✏ Edit</a>
                                    <a class="btn-action-view" target="_blank" href="<?=e((string)env_value('STOREFRONT_URL','https://www.monimala.com'))?>/products/<?=e($item['slug'])?>">↗ Store</a>
                                    <form method="post" action="/products/delete" style="display:inline-block;margin:0;" onsubmit="return confirm('Delete product <?=e(addslashes($item['name']))?>?');">
                                        <input type="hidden" name="_token" value="<?=csrf_token()?>">
                                        <input type="hidden" name="product_id" value="<?=e($item['id'])?>">
                                        <button type="submit" class="btn-action-delete">🗑 Delete</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                    <?php if (!$items): ?>
                        <tr><td colspan="6" class="empty-state">No products found matching the criteria.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </section>
    <?php
}

function product_edit_page(): void {
    $id=trim((string)($_GET['id']??'')); 
    $stmt=db()->prepare('SELECT * FROM Product WHERE id=? LIMIT 1'); 
    $stmt->execute([$id]); 
    $item=$stmt->fetch();
    if(!$item){
        http_response_code(404); 
        echo '<section class="panel"><h3>Product not found</h3><a class="button-secondary" href="/products">Back to products</a></section>'; 
        return;
    }
    $categories=db()->query('SELECT id,name FROM Category WHERE active=1 OR id=' . db()->quote($item['categoryId']) . ' ORDER BY name')->fetchAll(); 
    $colors=json_decode((string)($item['colors']??''),true)?:[]; 
    $sizes=json_decode((string)($item['sizes']??''),true)?:[];
    $images=json_decode((string)($item['images']??''),true)?:[];
    ?>
    <div class="page-actions" style="margin-bottom:16px;display:flex;gap:10px;align-items:center;">
        <a class="button-secondary" href="/products">← Back to Products Directory</a>
        <a class="button-secondary" target="_blank" href="<?=e((string)env_value('STOREFRONT_URL','https://www.monimala.com'))?>/products/<?=e($item['slug'])?>">View on Live Storefront ↗</a>
        <form method="post" action="/products/delete" style="margin-left:auto;" onsubmit="return confirm('Permanently delete product <?=e(addslashes($item['name']))?>?');">
            <input type="hidden" name="_token" value="<?=csrf_token()?>">
            <input type="hidden" name="product_id" value="<?=e($item['id'])?>">
            <button type="submit" class="btn-action-delete" style="padding:8px 14px;">🗑 Delete Product</button>
        </form>
    </div>

    <section class="panel">
        <div class="panel-heading">
            <div>
                <h3>Edit <?=e($item['name'])?></h3>
                <p>Update product specifications, prices, and media gallery below.</p>
            </div>
            <span class="status-pill <?=$item['active']?'status-live':'status-hidden'?>">
                <?=$item['active']?'Live on Storefront':'Hidden (Draft)'?>
            </span>
        </div>

        <form method="post" action="/products/update" enctype="multipart/form-data" class="form-grid" style="margin-top:16px;">
            <input type="hidden" name="_token" value="<?=csrf_token()?>">
            <input type="hidden" name="product_id" value="<?=e($item['id'])?>">

            <label>Product Name<input name="name" value="<?=e($item['name'])?>" required></label>
            <label>Slug (URL)<input name="slug" value="<?=e($item['slug'])?>" required></label>
            <label>SKU<input name="sku" value="<?=e($item['sku'])?>" required style="font-family:monospace;text-transform:uppercase;"></label>
            <label>Category / Collection
                <select name="category_id" required>
                    <?php foreach($categories as $cat): ?>
                        <option value="<?=e($cat['id'])?>" <?=$cat['id']===$item['categoryId']?'selected':''?>><?=e($cat['name'])?></option>
                    <?php endforeach; ?>
                </select>
            </label>
            <label>Selling Price (₹)<input name="price" type="number" min="0" value="<?=e($item['price'])?>" required></label>
            <label>Compare-At Price (₹, Optional)<input name="compare_at" type="number" min="0" value="<?=e($item['compareAt']??'')?>"></label>
            <label>Low-Stock Alert Level<input name="low_stock_at" type="number" min="0" value="<?=e($item['lowStockAt'])?>" required></label>
            <label>Storefront Ranking Rank<input name="position" type="number" min="0" value="<?=e($item['position'])?>"></label>
            <label>Metal / Finish<input name="metal" value="<?=e($item['metal']??'')?>"></label>
            <label>Occasion / Theme<input name="occasion" value="<?=e($item['occasion']??'')?>"></label>
            <label class="wide">Available Colors (Comma separated)<input name="colors" value="<?=e(implode(', ',$colors))?>"></label>
            <label class="wide">Available Sizes (Comma separated, e.g. 2.2, 2.4, 2.6)<input name="sizes" value="<?=e(implode(', ',$sizes))?>"></label>
            <label class="wide">YouTube Product Video URL<input name="youtube_url" type="url" value="<?=e($item['youtubeUrl']??'')?>"></label>

            <!-- Media Desk with Gallery, Upload, and URL Support -->
            <?php render_media_desk($images, 'edit'); ?>

            <label class="wide">Product Description<textarea name="description" rows="4"><?=e($item['description']??'')?></textarea></label>
            
            <label><input type="checkbox" name="featured" value="1" <?=$item['isFeatured']?'checked':''?>> ★ Best Seller / Featured Badge</label>
            <label><input type="checkbox" name="is_new" value="1" <?=$item['isNew']?'checked':''?>> Sparkle New Arrival</label>
            <label><input type="checkbox" name="active" value="1" <?=$item['active']?'checked':''?>> Visible on Storefront</label>

            <div class="wide form-actions" style="margin-top:16px;display:flex;gap:12px;">
                <button type="submit" style="padding:12px 24px;font-size:14px;">Save Product Changes</button>
                <a class="button-secondary" href="/products" style="padding:12px 20px;">Cancel</a>
            </div>
        </form>
    </section>
    <?php
}
function inventory_page(): void {
    $items=db()->query('SELECT p.id,p.sku,p.name,p.stock,p.lowStockAt,c.name category FROM Product p JOIN Category c ON c.id=p.categoryId WHERE p.active=1 ORDER BY p.stock ASC')->fetchAll();
    ?>
    <section class="panel">
        <div class="panel-heading">
            <div>
                <h3>Current Stock Ledger</h3>
                <p>Live inventory on hand and safety stock alert levels</p>
            </div>
        </div>
        <table>
            <thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>On hand</th><th>Quick Stock Adjustment</th></tr></thead>
            <tbody>
                <?php foreach($items as $item): ?>
                    <tr>
                        <td><code><?=e($item['sku'])?></code></td>
                        <td><?=e($item['name'])?></td>
                        <td><?=e($item['category'])?></td>
                        <td class="<?=((int)$item['stock']<=(int)$item['lowStockAt'])?'danger':''?>">
                            <strong><?=e($item['stock'])?></strong>
                            <?php if((int)$item['stock']<=(int)$item['lowStockAt']): ?>
                                <small class="danger">Low (&le;<?=e($item['lowStockAt'])?>)</small>
                            <?php endif; ?>
                        </td>
                        <td>
                            <form method="post" action="/inventory/adjust" class="inline">
                                <input type="hidden" name="_token" value="<?=csrf_token()?>">
                                <input type="hidden" name="product_id" value="<?=e($item['id'])?>">
                                <input name="quantity" type="number" required placeholder="+/- qty" style="width:85px;">
                                <select name="reason" style="width:140px;">
                                    <option value="RESTOCK">Restock</option>
                                    <option value="CUSTOMER_RETURN">Return</option>
                                    <option value="DAMAGE_WRITE_OFF">Damaged</option>
                                    <option value="AUDIT_CORRECTION">Audit</option>
                                </select>
                                <input name="reference" placeholder="Ref (e.g. PO#)" style="width:110px;">
                                <button>Post</button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </section>
    <?php
}

function inventory_movements_page(): void {
    $logs = db()->query("SELECT m.id, m.quantity, m.reason, m.reference, m.createdAt, p.name productName, p.sku, u.name actorName, u.email actorEmail FROM InventoryMovement m JOIN Product p ON p.id = m.productId LEFT JOIN User u ON u.id = m.actorId ORDER BY m.createdAt DESC LIMIT 35")->fetchAll();
    ?>
    <section class="panel">
        <div class="panel-heading">
            <div>
                <h3>Stock Movement Audit Ledger</h3>
                <p>Recent auditable stock adjustments, order reservations, and inventory events</p>
            </div>
        </div>
        <table>
            <thead>
                <tr><th>Date & Time</th><th>Product</th><th>Change</th><th>Reason</th><th>Reference</th><th>Staff / Event</th></tr>
            </thead>
            <tbody>
                <?php foreach ($logs as $log): 
                    $isPositive = (int)$log['quantity'] > 0;
                ?>
                    <tr>
                        <td><small><?=e(date('M j, Y H:i', strtotime($log['createdAt'])))?></small></td>
                        <td><strong><?=e($log['productName'])?></strong><small>SKU: <?=e($log['sku'])?></small></td>
                        <td>
                            <strong class="<?=$isPositive ? 'stock-plus' : 'stock-minus'?>">
                                <?=$isPositive ? '+' . $log['quantity'] : $log['quantity']?>
                            </strong>
                        </td>
                        <td><span class="reason-chip"><?=e($log['reason'])?></span></td>
                        <td><?=e($log['reference'] ?: '—')?></td>
                        <td><small><?=e($log['actorName'] ?: $log['actorEmail'] ?: 'Customer Order')?></small></td>
                    </tr>
                <?php endforeach; ?>
                <?php if (!$logs): ?>
                    <tr><td colSpan="6" class="empty-state">No inventory movements recorded yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </section>
    <?php
}

function orders_page(): void {
    $status = trim((string)($_GET['status'] ?? 'ALL'));
    $q = trim((string)($_GET['q'] ?? ''));
    $sql = 'SELECT id,trackingCode,email,phone,address,total,status,paymentStatus,createdAt FROM `Order` WHERE 1=1';
    $params = [];
    if ($status !== '' && $status !== 'ALL') {
        $sql .= ' AND status = ?';
        $params[] = $status;
    }
    if ($q !== '') {
        $sql .= ' AND (trackingCode LIKE ? OR email LIKE ? OR phone LIKE ?)';
        $params[] = "%$q%"; $params[] = "%$q%"; $params[] = "%$q%";
    }
    $sql .= ' ORDER BY createdAt DESC LIMIT 100';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();

    $orderIds = array_column($orders, 'id');
    $itemsByOrder = [];
    if ($orderIds) {
        $inQuery = implode(',', array_fill(0, count($orderIds), '?'));
        $itemStmt = db()->prepare("SELECT oi.orderId, oi.quantity, oi.price, oi.color, oi.size, p.name, p.sku FROM OrderItem oi JOIN Product p ON p.id = oi.productId WHERE oi.orderId IN ($inQuery)");
        $itemStmt->execute($orderIds);
        foreach ($itemStmt->fetchAll() as $row) {
            $itemsByOrder[$row['orderId']][] = $row;
        }
    }
    ?>
    <section class="panel">
        <div class="panel-heading">
            <div>
                <h3>Store Orders (<?=count($orders)?>)</h3>
                <p>Inspect customer delivery addresses, view ordered items & attributes, and update fulfillment</p>
            </div>
        </div>
        <form method="get" action="/orders" class="catalogue-filters">
            <label>Search orders
                <input type="search" name="q" value="<?=e($q)?>" placeholder="Tracking code, email, phone">
            </label>
            <label>Fulfillment status
                <select name="status">
                    <option value="ALL" <?=$status==='ALL'?'selected':''?>>All Statuses</option>
                    <?php foreach (['PENDING','PAID','PACKED','SHIPPED','DELIVERED','CANCELLED'] as $st): ?>
                        <option value="<?=$st?>" <?=$status===$st?'selected':''?>><?=$st?></option>
                    <?php endforeach; ?>
                </select>
            </label>
            <button>Filter</button>
            <a class="button-secondary" href="/orders">Clear</a>
        </form>

        <div class="orders-accordion">
            <?php foreach ($orders as $order): 
                $items = $itemsByOrder[$order['id']] ?? [];
                $cleanPhone = preg_replace('/[^0-9]/', '', $order['phone']);
            ?>
                <details class="order-detail-card" id="order-<?=e($order['id'])?>">
                    <summary class="order-header-row">
                        <div>
                            <strong class="order-code"><?=e($order['trackingCode'])?></strong>
                            <span class="status-badge status-<?=strtolower(e($order['status']))?>"><?=e($order['status'])?></span>
                            <span class="status-badge status-pay-<?=strtolower(e($order['paymentStatus']))?>"><?=e($order['paymentStatus'])?></span>
                        </div>
                        <div class="order-summary-meta">
                            <span><?=e($order['email'])?></span>
                            <strong>₹<?=number_format((int)$order['total'])?></strong>
                            <small><?=e(date('M j, Y H:i', strtotime($order['createdAt'])))?></small>
                        </div>
                    </summary>

                    <div class="order-expanded-content">
                        <div class="order-info-grid">
                            <div class="info-block">
                                <h4>Customer Contact & Shipping Address</h4>
                                <p><strong>Email:</strong> <?=e($order['email'])?></p>
                                <p><strong>Phone:</strong> <?=e($order['phone'])?></p>
                                <p><strong>Delivery Address:</strong></p>
                                <blockquote class="address-box"><?=nl2br(e($order['address']))?></blockquote>
                                <div class="action-buttons-row">
                                    <?php if ($cleanPhone): ?>
                                        <a class="button-whatsapp" target="_blank" href="https://wa.me/<?=str_starts_with($cleanPhone,'91')?$cleanPhone:'91'.$cleanPhone?>?text=<?=urlencode('Hello! This is Monimala Store regarding your order ' . $order['trackingCode'] . '.')?>">
                                            Notify via WhatsApp ↗
                                        </a>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <div class="info-block">
                                <h4>Fulfillment Actions</h4>
                                <form method="post" action="/orders/status" class="form-status-update">
                                    <input type="hidden" name="_token" value="<?=csrf_token()?>">
                                    <input type="hidden" name="order_id" value="<?=e($order['id'])?>">
                                    <label>Update Status:
                                        <select name="status">
                                            <?php foreach (['PENDING','PAID','PACKED','SHIPPED','DELIVERED','CANCELLED'] as $s): ?>
                                                <option value="<?=$s?>" <?=$s===$order['status']?'selected':''?>><?=$s?></option>
                                            <?php endforeach; ?>
                                        </select>
                                    </label>
                                    <button style="margin-top:8px;">Update Status</button>
                                </form>
                            </div>
                        </div>

                        <div class="order-items-block">
                            <h4>Ordered Items (<?=count($items)?>)</h4>
                            <table>
                                <thead>
                                    <tr><th>Product Name</th><th>SKU</th><th>Chosen Options</th><th>Quantity</th><th>Unit Price</th><th>Line Total</th></tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($items as $item): ?>
                                        <tr>
                                            <td><strong><?=e($item['name'])?></strong></td>
                                            <td><code><?=e($item['sku'])?></code></td>
                                            <td>
                                                <?=($item['color'] ? '<span class="reason-chip">Color: ' . e($item['color']) . '</span> ' : '')?>
                                                <?=($item['size'] ? '<span class="reason-chip">Size: ' . e($item['size']) . '</span>' : '')?>
                                                <?=(!$item['color'] && !$item['size'] ? '—' : '')?>
                                            </td>
                                            <td><?=e($item['quantity'])?></td>
                                            <td>₹<?=number_format((int)$item['price'])?></td>
                                            <td><strong>₹<?=number_format((int)($item['price'] * $item['quantity']))?></strong></td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </details>
            <?php endforeach; ?>
            <?php if (!$orders): ?>
                <p class="empty-state">No orders match these criteria.</p>
            <?php endif; ?>
        </div>
    </section>
    <?php
}

function customers_page(): void {
    $customers = db()->query("SELECT u.id, u.name, u.email, u.phone, u.createdAt, COUNT(o.id) as orderCount, COALESCE(SUM(CASE WHEN o.paymentStatus='PAID' THEN o.total ELSE 0 END), 0) as totalSpent FROM User u LEFT JOIN `Order` o ON o.userId = u.id WHERE u.role='CUSTOMER' GROUP BY u.id, u.name, u.email, u.phone, u.createdAt ORDER BY u.createdAt DESC")->fetchAll();
    ?>
    <section class="panel">
        <div class="panel-heading">
            <div>
                <h3>Customer Directory (<?=count($customers)?>)</h3>
                <p>Registered customer profiles, ordering frequency, and customer lifetime value</p>
            </div>
        </div>
        <table>
            <thead>
                <tr><th>Customer Name</th><th>Contact</th><th>Total Orders</th><th>Paid Lifetime Spend</th><th>Member Since</th><th>Actions</th></tr>
            </thead>
            <tbody>
                <?php foreach ($customers as $c): 
                    $cleanPhone = preg_replace('/[^0-9]/', '', (string)$c['phone']);
                ?>
                    <tr>
                        <td><strong><?=e($c['name'])?></strong></td>
                        <td>
                            <span><?=e($c['email'])?></span>
                            <small><?=e($c['phone'] ?: 'No phone number')?></small>
                        </td>
                        <td><strong><?=e($c['orderCount'])?></strong></td>
                        <td><strong>₹<?=number_format((int)$c['totalSpent'])?></strong></td>
                        <td><?=e(date('M j, Y', strtotime($c['createdAt'])))?></td>
                        <td>
                            <a class="button-secondary" href="mailto:<?=e($c['email'])?>">Email</a>
                            <?php if ($cleanPhone): ?>
                                <a class="button-whatsapp" target="_blank" href="https://wa.me/<?=str_starts_with($cleanPhone,'91')?$cleanPhone:'91'.$cleanPhone?>">WhatsApp</a>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
                <?php if (!$customers): ?>
                    <tr><td colSpan="6" class="empty-state">No customers registered yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </section>
    <?php
}

function coupons_page(): void {
    $coupons = db()->query("SELECT id, code, percent, active, expiresAt FROM Coupon ORDER BY id DESC")->fetchAll();
    ?>
    <section class="panel">
        <div class="panel-heading">
            <div>
                <h3>Create Promotional Coupon</h3>
                <p>Add discount percentage coupons for seasonal offers or marketing campaigns</p>
            </div>
        </div>
        <form method="post" action="/coupons/create" class="form-grid">
            <input type="hidden" name="_token" value="<?=csrf_token()?>">
            <label>Coupon Code
                <input name="code" required placeholder="e.g. BIHU15, FESTIVE20" style="text-transform: uppercase;">
            </label>
            <label>Discount (%)
                <input name="percent" type="number" min="1" max="100" required value="10">
            </label>
            <label>Expiry Date (Optional)
                <input name="expires_at" type="date">
            </label>
            <button>Issue Coupon</button>
        </form>
    </section>

    <section class="panel">
        <div class="panel-heading">
            <div>
                <h3>Active Store Coupons (<?=count($coupons)?>)</h3>
                <p>Eligible promotional codes for checkout discounts</p>
            </div>
        </div>
        <table>
            <thead>
                <tr><th>Code</th><th>Discount</th><th>Status</th><th>Expiry</th><th>Actions</th></tr>
            </thead>
            <tbody>
                <?php foreach ($coupons as $coupon): 
                    $isExpired = $coupon['expiresAt'] && strtotime($coupon['expiresAt']) < time();
                ?>
                    <tr>
                        <td><strong style="font-family: monospace; font-size: 15px; color:#611320;"><?=e($coupon['code'])?></strong></td>
                        <td><strong><?=e($coupon['percent'])?>% OFF</strong></td>
                        <td>
                            <span class="status <?=$coupon['active'] && !$isExpired ? 'live' : 'draft'?>">
                                <?=$coupon['active'] && !$isExpired ? 'Active' : ($isExpired ? 'Expired' : 'Disabled')?>
                            </span>
                        </td>
                        <td><?=e($coupon['expiresAt'] ? date('M j, Y', strtotime($coupon['expiresAt'])) : 'Never expires')?></td>
                        <td>
                            <form method="post" action="/coupons/toggle" style="display:inline-block;">
                                <input type="hidden" name="_token" value="<?=csrf_token()?>">
                                <input type="hidden" name="coupon_id" value="<?=e($coupon['id'])?>">
                                <input type="hidden" name="active" value="<?=$coupon['active'] ? '0' : '1'?>">
                                <button class="button-secondary"><?=$coupon['active'] ? 'Disable' : 'Enable'?></button>
                            </form>
                            <form method="post" action="/coupons/delete" style="display:inline-block; margin-left:6px;" onsubmit="return confirm('Delete coupon <?=e($coupon['code'])?>?');">
                                <input type="hidden" name="_token" value="<?=csrf_token()?>">
                                <input type="hidden" name="coupon_id" value="<?=e($coupon['id'])?>">
                                <button style="background: #fee4e2; color: #b42318; border: 1px solid #fecdca;">Delete</button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?>
                <?php if (!$coupons): ?>
                    <tr><td colSpan="5" class="empty-state">No coupons created yet.</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </section>
    <?php
}
