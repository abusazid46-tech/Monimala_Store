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
    if ($productId==='' || $quantity===false || $quantity===0 || strlen($reason)<3) { http_response_code(422); exit('Invalid stock adjustment.'); }
    $pdo=db(); $pdo->beginTransaction();
    try {
        $stmt=$pdo->prepare('SELECT stock FROM Product WHERE id=? FOR UPDATE'); $stmt->execute([$productId]); $product=$stmt->fetch();
        if (!$product || (int)$product['stock']+$quantity<0) throw new RuntimeException('Stock cannot become negative.');
        $pdo->prepare('UPDATE Product SET stock=stock+?,updatedAt=NOW(3) WHERE id=?')->execute([$quantity,$productId]);
        $pdo->prepare('INSERT INTO InventoryMovement (id,productId,actorId,quantity,reason,reference,createdAt) VALUES (?,?,?,?,?,?,NOW(3))')->execute(['php_'.bin2hex(random_bytes(12)),$productId,admin()['id'],$quantity,$reason,trim((string)($_POST['reference']??''))?:null]);
        $pdo->commit(); redirect('/inventory');
    } catch(Throwable $error) { $pdo->rollBack(); http_response_code(422); exit(e($error->getMessage())); }
}
if ($path === '/orders/status' && $method === 'POST') {
    verify_csrf(); $allowed=['PENDING','PAID','PACKED','SHIPPED','DELIVERED','CANCELLED'];
    if (!in_array($_POST['status']??'',$allowed,true)) { http_response_code(422); exit('Invalid status.'); }
    db()->prepare('UPDATE `Order` SET status=?,updatedAt=NOW(3) WHERE id=?')->execute([$_POST['status'],$_POST['order_id']]); redirect('/orders');
}
if ($path === '/products/update' && $method === 'POST') {
    verify_csrf();
    $price=filter_var($_POST['price']??null,FILTER_VALIDATE_INT); $low=filter_var($_POST['low_stock_at']??null,FILTER_VALIDATE_INT);
    if ($price===false || $price<0 || $low===false || $low<0) { http_response_code(422); exit('Invalid product values.'); }
    db()->prepare('UPDATE Product SET price=?,lowStockAt=?,active=?,updatedAt=NOW(3) WHERE id=?')->execute([$price,$low,isset($_POST['active'])?1:0,$_POST['product_id']]);
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
    $stmt=db()->prepare('SELECT colorImages FROM Product WHERE id=?'); $stmt->execute([$id]); $current=$stmt->fetchColumn(); $map=$current?json_decode((string)$current,true):[]; if(!is_array($map))$map=[];
    $colorName=trim((string)($_POST['color_name']??'')); $colorUpload=uploaded_product_images($_FILES['color_image_file']??null,1);
    if($colorName!=='' && $colorUpload) { $map[$colorName]=$colorUpload[0]; if(!in_array($colorName,$colors,true))$colors[]=$colorName; }
    db()->prepare('UPDATE Product SET colors=?,sizes=?,colorImages=?,position=?,updatedAt=NOW(3) WHERE id=?')->execute([json_encode($colors),json_encode($sizes),json_encode($map,JSON_UNESCAPED_SLASHES),max(0,(int)($_POST['position']??0)),$id]); redirect('/products');
}
if ($path === '/categories/ranking' && $method === 'POST') {
    verify_csrf(); db()->prepare('UPDATE Category SET position=?,updatedAt=NOW(3) WHERE id=?')->execute([max(0,(int)($_POST['position']??0)),(string)$_POST['category_id']]); redirect('/categories');
}
if ($path === '/categories/update' && $method === 'POST') {
    verify_csrf();
    $id=trim((string)($_POST['category_id']??'')); $name=trim((string)($_POST['name']??'')); $image=category_image($_FILES['image_file']??null,trim((string)($_POST['image_url']??'')));
    if($id==='' || strlen($name)<2) { http_response_code(422); exit('A valid category is required.'); }
    if($image===null) db()->prepare('UPDATE Category SET name=?,active=?,updatedAt=NOW(3) WHERE id=?')->execute([$name,isset($_POST['active'])?1:0,$id]);
    else db()->prepare('UPDATE Category SET name=?,image=?,active=?,updatedAt=NOW(3) WHERE id=?')->execute([$name,$image,isset($_POST['active'])?1:0,$id]);
    redirect('/categories');
}
if ($path === '/categories/create' && $method === 'POST') {
    verify_csrf();
    $name=trim((string)($_POST['name']??'')); $slug=slugify((string)($_POST['slug']?:$name)); $parent=trim((string)($_POST['parent_id']??''))?:null;
    if(strlen($name)<2 || $slug==='') { http_response_code(422); exit('Category name is required.'); }
    try { db()->prepare('INSERT INTO Category (id,name,slug,description,image,parentId,active,createdAt,updatedAt) VALUES (?,?,?,?,?,?,1,NOW(3),NOW(3))')->execute(['php_'.bin2hex(random_bytes(12)),$name,$slug,trim((string)($_POST['description']??''))?:null,trim((string)($_POST['image']??''))?:null,$parent]); }
    catch(PDOException $error) { http_response_code(422); exit($error->getCode()==='23000'?'That category slug already exists.':'Unable to create category.'); }
    redirect('/categories');
}
if ($path === '/products/create' && $method === 'POST') {
    verify_csrf();
    $name=trim((string)($_POST['name']??'')); $slug=slugify((string)($_POST['slug']?:$name)); $price=filter_var($_POST['price']??null,FILTER_VALIDATE_INT); $stock=filter_var($_POST['stock']??null,FILTER_VALIDATE_INT);
    $images=array_values(array_filter(array_map('trim',preg_split('/[\r\n,]+/',(string)($_POST['images']??''))?:[])));
    if(strlen($name)<2 || $slug==='' || $price===false || $price<0 || $stock===false || $stock<0 || empty($_POST['category_id']) || empty($_POST['sku']) || !$images) { http_response_code(422); exit('Complete every required product field.'); }
    $id='php_'.bin2hex(random_bytes(12)); $pdo=db(); $pdo->beginTransaction();
    try {
        $pdo->prepare('INSERT INTO Product (id,name,slug,description,price,compareAt,stock,sku,images,metal,occasion,isFeatured,isNew,categoryId,active,lowStockAt,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(3),NOW(3))')->execute([$id,$name,$slug,trim((string)$_POST['description']),$price,null,$stock,strtoupper(trim((string)$_POST['sku'])),json_encode($images,JSON_UNESCAPED_SLASHES),trim((string)$_POST['metal'])?:null,trim((string)$_POST['occasion'])?:null,isset($_POST['featured'])?1:0,isset($_POST['is_new'])?1:0,$_POST['category_id'],1,max(0,(int)($_POST['low_stock_at']??5))]);
        if($stock>0) $pdo->prepare('INSERT INTO InventoryMovement (id,productId,actorId,quantity,reason,reference,createdAt) VALUES (?,?,?,?,?,?,NOW(3))')->execute(['php_'.bin2hex(random_bytes(12)),$id,admin()['id'],$stock,'OPENING_STOCK','Product creation']);
        $pdo->commit();
    } catch(Throwable $error) { $pdo->rollBack(); http_response_code(422); exit('SKU or slug already exists, or the category is invalid.'); }
    redirect('/products');
}

layout_start(match($path){'/categories'=>'Categories','/products'=>'Products','/inventory'=>'Inventory','/orders'=>'Orders',default=>'Dashboard'});
if($path==='/categories') { categories_page(); category_ranking_page(); } elseif($path==='/products') { products_page(); product_advanced_page(); } elseif($path==='/inventory') inventory_page(); elseif($path==='/orders') orders_page(); else dashboard_page();
layout_end();

function login_page(string $error=''): void { ?><!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Admin Login</title><link rel="stylesheet" href="/assets/admin.css"></head><body class="login"><form method="post" class="login-card"><h1>Monimala Admin</h1><p>Authorised staff only</p><?php if($error):?><div class="error"><?=e($error)?></div><?php endif?><input type="hidden" name="_token" value="<?=csrf_token()?>"><label>Email<input name="email" type="email" required autocomplete="username"></label><label>Password<input name="password" type="password" required autocomplete="current-password"></label><button>Secure sign in</button></form></body></html><?php }
function layout_start(string $title): void { ?><!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title><?=e($title)?> · Monimala</title><link rel="stylesheet" href="/assets/admin.css"></head><body><aside><div><h1>Monimala</h1><p>Commerce Control</p></div><nav><a href="/">Dashboard</a><a href="/categories">Categories</a><a href="/products">Products</a><a href="/inventory">Inventory</a><a href="/orders">Orders</a></nav><form method="post" action="/logout"><input type="hidden" name="_token" value="<?=csrf_token()?>"><button>Sign out</button></form></aside><main><header><div><small>MONIMALA STORE</small><h2><?=e($title)?></h2></div><span><?=e(admin()['name'])?></span></header><?php }
function layout_end(): void { ?></main></body></html><?php }
function dashboard_page(): void { $pdo=db(); $stats=['Products'=>$pdo->query('SELECT COUNT(*) FROM Product WHERE active=1')->fetchColumn(),'Low stock'=>$pdo->query('SELECT COUNT(*) FROM Product WHERE active=1 AND stock<=lowStockAt')->fetchColumn(),'Open orders'=>$pdo->query("SELECT COUNT(*) FROM `Order` WHERE status NOT IN ('DELIVERED','CANCELLED')")->fetchColumn(),'Paid revenue'=>$pdo->query("SELECT COALESCE(SUM(total),0) FROM `Order` WHERE paymentStatus='PAID'")->fetchColumn()]; echo '<section class="stats">'; foreach($stats as $label=>$value) echo '<article><small>'.e($label).'</small><strong>'.e($value).'</strong></article>'; echo '</section>'; }
function list_values(string $value): array { return array_values(array_unique(array_filter(array_map('trim',preg_split('/[\r\n,]+/',$value)?:[])))); }
function uploaded_product_images(?array $files,int $limit=5): array {
    if(!$files || !isset($files['name']))return []; $names=is_array($files['name'])?$files['name']:[$files['name']]; $results=[];
    foreach($names as $index=>$name) {
        $error=is_array($files['error'])?$files['error'][$index]:$files['error']; if($error===UPLOAD_ERR_NO_FILE)continue;
        $size=is_array($files['size'])?$files['size'][$index]:$files['size']; $tmp=is_array($files['tmp_name'])?$files['tmp_name'][$index]:$files['tmp_name'];
        if($error!==UPLOAD_ERR_OK || $size>5242880) { http_response_code(422); exit('Each product photo must be under 5 MB.'); }
        $types=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp']; $mime=(new finfo(FILEINFO_MIME_TYPE))->file($tmp); $extension=$types[$mime]??null;
        if(!$extension){http_response_code(422);exit('Product photos must be JPG, PNG or WebP.');}
        $directory=__DIR__.'/uploads/products'; if(!is_dir($directory)&&!mkdir($directory,0755,true)&&!is_dir($directory)){http_response_code(500);exit('Upload directory unavailable.');}
        $filename=bin2hex(random_bytes(12)).'.'.$extension; if(!move_uploaded_file($tmp,$directory.'/'.$filename)){http_response_code(500);exit('Unable to save product photo.');}
        $results[]=rtrim((string)env_value('APP_URL','https://backend.monimal.com'),'/').'/uploads/products/'.$filename; if(count($results)>$limit){http_response_code(422);exit('Too many product photos.');}
    }
    return $results;
}
function slugify(string $value): string { $value=strtolower(trim($value)); $value=preg_replace('/[^a-z0-9]+/','-',$value)??''; return trim($value,'-'); }
function category_image(?array $file,string $url): ?string {
    if($file && ($file['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_NO_FILE) {
        if(($file['error']??UPLOAD_ERR_OK)!==UPLOAD_ERR_OK || ($file['size']??0)>3145728) { http_response_code(422); exit('Image upload failed or exceeds 3 MB.'); }
        $types=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp']; $mime=(new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']); $extension=$types[$mime]??null;
        if(!$extension) { http_response_code(422); exit('Use a JPG, PNG or WebP image.'); }
        $directory=__DIR__.'/uploads/categories'; if(!is_dir($directory) && !mkdir($directory,0755,true) && !is_dir($directory)) { http_response_code(500); exit('Upload directory is unavailable.'); }
        $filename=bin2hex(random_bytes(12)).'.'.$extension; if(!move_uploaded_file($file['tmp_name'],$directory.'/'.$filename)) { http_response_code(500); exit('Unable to save image.'); }
        return rtrim((string)env_value('APP_URL','https://backend.monimal.com'),'/').'/uploads/categories/'.$filename;
    }
    if($url==='') return null;
    if(!str_starts_with($url,'/') && !filter_var($url,FILTER_VALIDATE_URL)) { http_response_code(422); exit('Enter a valid image URL.'); }
    return $url;
}
function categories_page(): void { $items=db()->query('SELECT c.id,c.name,c.slug,c.image,c.active,p.name parent FROM Category c LEFT JOIN Category p ON p.id=c.parentId ORDER BY c.parentId IS NOT NULL,c.createdAt,c.name')->fetchAll(); ?><section class="panel"><h3>Create category or subcategory</h3><form method="post" action="/categories/create" class="form-grid"><input type="hidden" name="_token" value="<?=csrf_token()?>"><label>Name<input name="name" required></label><label>Slug (optional)<input name="slug"></label><label>Parent category<select name="parent_id"><option value="">Top-level category</option><?php foreach($items as $item):?><option value="<?=e($item['id'])?>"><?=e(($item['parent']?$item['parent'].' → ':'').$item['name'])?></option><?php endforeach?></select></label><label>Image URL<input name="image"></label><label class="wide">Description<textarea name="description"></textarea></label><button>Create category</button></form></section><section class="panel"><h3>Category icons</h3><p>Upload a square transparent PNG/WebP or enter an image URL. The new icon appears on the storefront immediately.</p><table><thead><tr><th>Icon</th><th>Category</th><th>Parent</th><th>Replace icon and update</th></tr></thead><tbody><?php foreach($items as $item):?><tr><td><?php if($item['image']):?><img class="category-thumb" src="<?=e($item['image'])?>" alt=""><?php else:?><span>No icon</span><?php endif?></td><td><strong><?=e($item['name'])?></strong><small><?=e($item['slug'])?></small></td><td><?=e($item['parent']?:'Top level')?></td><td><form method="post" action="/categories/update" enctype="multipart/form-data" class="category-edit"><input type="hidden" name="_token" value="<?=csrf_token()?>"><input type="hidden" name="category_id" value="<?=e($item['id'])?>"><input name="name" value="<?=e($item['name'])?>" required aria-label="Category name"><input name="image_file" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" aria-label="Upload category icon"><input name="image_url" type="url" placeholder="Or paste image URL" aria-label="Category image URL"><label><input name="active" type="checkbox" <?=$item['active']?'checked':''?>> Active</label><button>Save</button></form></td></tr><?php endforeach?></tbody></table></section><?php }
function products_page(): void { $items=db()->query('SELECT p.id,p.sku,p.name,p.price,p.lowStockAt,p.active,c.name category FROM Product p JOIN Category c ON c.id=p.categoryId ORDER BY p.updatedAt DESC')->fetchAll(); $categories=db()->query('SELECT id,name FROM Category WHERE active=1 ORDER BY name')->fetchAll(); ?><section class="panel"><h3>Create product</h3><form method="post" action="/products/create" class="form-grid"><input type="hidden" name="_token" value="<?=csrf_token()?>"><label>Name<input name="name" required></label><label>Slug (optional)<input name="slug"></label><label>SKU<input name="sku" required></label><label>Category<select name="category_id" required><option value="">Select category</option><?php foreach($categories as $category):?><option value="<?=e($category['id'])?>"><?=e($category['name'])?></option><?php endforeach?></select></label><label>Price in ₹<input name="price" type="number" min="0" required></label><label>Opening stock<input name="stock" type="number" min="0" value="0" required></label><label>Low-stock alert<input name="low_stock_at" type="number" min="0" value="5" required></label><label>Metal/finish<input name="metal"></label><label>Occasion<input name="occasion"></label><label class="wide">Image URLs (one per line)<textarea name="images" required></textarea></label><label class="wide">Description<textarea name="description" required></textarea></label><label><input type="checkbox" name="featured"> Featured</label><label><input type="checkbox" name="is_new"> New arrival</label><button>Create product</button></form></section><section class="panel"><h3>Product controls</h3><table><thead><tr><th>Product</th><th>Category</th><th>Commercial settings</th></tr></thead><tbody><?php foreach($items as $item):?><tr><td><strong><?=e($item['name'])?></strong><small><?=e($item['sku'])?></small></td><td><?=e($item['category'])?></td><td><form method="post" action="/products/update" class="inline"><input type="hidden" name="_token" value="<?=csrf_token()?>"><input type="hidden" name="product_id" value="<?=e($item['id'])?>"><input name="price" type="number" min="0" value="<?=e($item['price'])?>" required aria-label="Price"><input name="low_stock_at" type="number" min="0" value="<?=e($item['lowStockAt'])?>" required aria-label="Low stock threshold"><label><input name="active" type="checkbox" <?=$item['active']?'checked':''?>> Active</label><button>Save</button></form></td></tr><?php endforeach?></tbody></table></section><?php }
function inventory_page(): void { $items=db()->query('SELECT p.id,p.sku,p.name,p.stock,p.lowStockAt,c.name category FROM Product p JOIN Category c ON c.id=p.categoryId WHERE p.active=1 ORDER BY p.stock ASC')->fetchAll(); ?><section class="panel"><h3>Stock ledger</h3><table><thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>On hand</th><th>Adjustment</th></tr></thead><tbody><?php foreach($items as $item):?><tr><td><?=e($item['sku'])?></td><td><?=e($item['name'])?></td><td><?=e($item['category'])?></td><td class="<?=((int)$item['stock']<=(int)$item['lowStockAt'])?'danger':''?>"><?=e($item['stock'])?></td><td><form method="post" action="/inventory/adjust" class="inline"><input type="hidden" name="_token" value="<?=csrf_token()?>"><input type="hidden" name="product_id" value="<?=e($item['id'])?>"><input name="quantity" type="number" required placeholder="+/- qty"><input name="reason" required placeholder="Reason"><input name="reference" placeholder="Reference"><button>Post</button></form></td></tr><?php endforeach?></tbody></table></section><?php }
function orders_page(): void { $orders=db()->query('SELECT id,trackingCode,email,total,status,paymentStatus,createdAt FROM `Order` ORDER BY createdAt DESC LIMIT 100')->fetchAll(); ?><section class="panel"><h3>Latest orders</h3><table><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Fulfilment</th></tr></thead><tbody><?php foreach($orders as $order):?><tr><td><?=e($order['trackingCode'])?><small><?=e($order['createdAt'])?></small></td><td><?=e($order['email'])?></td><td>₹<?=number_format((int)$order['total'])?></td><td><?=e($order['paymentStatus'])?></td><td><form method="post" action="/orders/status" class="inline"><input type="hidden" name="_token" value="<?=csrf_token()?>"><input type="hidden" name="order_id" value="<?=e($order['id'])?>"><select name="status"><?php foreach(['PENDING','PAID','PACKED','SHIPPED','DELIVERED','CANCELLED'] as $s):?><option <?=$s===$order['status']?'selected':''?>><?=$s?></option><?php endforeach?></select><button>Update</button></form></td></tr><?php endforeach?></tbody></table></section><?php }
