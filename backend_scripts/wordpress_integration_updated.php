<?php
/**
 * ============================================
 * INTEGRACIÓN COTIZADOR 3D - MECHATRONICSTORE
 * ============================================
 * Copia este código en el functions.php de tu tema o plugin de snippets.
 */

// IMPORTANTE: ID del producto creado
define('PRODUCTO_IMPRESION_3D_ID', 709550);

/**
 * Procesar token de cotización 3D y añadir al carrito
 */
add_action('template_redirect', 'mecha_procesar_cotizacion_3d');
function mecha_procesar_cotizacion_3d()
{
    // Solo procesar si viene el parámetro token en la URL del carrito
    if (!isset($_GET['cotizacion_3d_token'])) {
        return;
    }

    $token = sanitize_text_field($_GET['cotizacion_3d_token']);
    if (empty($token) || strlen($token) !== 32) {
        wc_add_notice('Token de cotización inválido.', 'error');
        wp_redirect(wc_get_cart_url());
        exit;
    }

    // Obtener datos de la cotización desde Dashboard
// Asegurarse de que obtener-cotizacion.php devuelva TODOS los campos nuevos (infill, layerHeight, dimensions)
    $api_url = 'https://dashboard.mechatronicstore.cl/api/3d/obtener-cotizacion.php?token=' . urlencode($token);
    $response = wp_remote_get($api_url, array(
        'timeout' => 15,
        'sslverify' => true
    ));

    if (is_wp_error($response)) {
        wc_add_notice('Error de conexión. Intenta nuevamente.', 'error');
        wp_redirect(wc_get_cart_url());
        exit;
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (!$data || !isset($data['success']) || !$data['success']) {
        $error_msg = isset($data['error']) ? $data['error'] : 'Cotización expirada o inválida.';
        wc_add_notice($error_msg, 'error');
        wp_redirect(wc_get_cart_url());
        exit;
    }

    $cotizacion = $data['cotizacion'];

    // Verificar que el producto existe
    $product = wc_get_product(PRODUCTO_IMPRESION_3D_ID);
    if (!$product) {
        wc_add_notice('Producto de impresión 3D no configurado.', 'error');
        wp_redirect(wc_get_cart_url());
        exit;
    }



    // Datos personalizados para el carrito
    $cart_item_data = array(
        'impresion_3d' => true,
        'custom_price' => floatval($cotizacion['price']),
        'file_name' => sanitize_text_field($cotizacion['file_name']),
        'drive_url' => esc_url_raw($cotizacion['drive_url']),
        'material' => sanitize_text_field($cotizacion['material']),
        'color' => sanitize_text_field($cotizacion['color']),
        'weight' => floatval($cotizacion['weight']), // en gramos

        // NUEVOS CAMPOS RECUPERADOS
        'infill' => isset($cotizacion['infill']) ? sanitize_text_field($cotizacion['infill']) : '',
        'layer_height' => isset($cotizacion['layerHeight']) ? sanitize_text_field($cotizacion['layerHeight']) : (isset($cotizacion['layer_height']) ? sanitize_text_field($cotizacion['layer_height']) : ''),
        'dimensions' => isset($cotizacion['dimensions']) ? sanitize_text_field($cotizacion['dimensions']) : '', // string"XxYxZ" en mm

        'cotizacion_id' => intval($cotizacion['id']),
        'unique_key' => md5($token . time())
    );

    // Añadir al carrito
    $cart_item_key = WC()->cart->add_to_cart(
        PRODUCTO_IMPRESION_3D_ID,
        1,
        0,
        array(),
        $cart_item_data
    );

    if ($cart_item_key) {
        wc_add_notice('¡Impresión 3D añadida al carrito!', 'success');
    } else {
        wc_add_notice('Error al añadir al carrito. Intenta nuevamente.', 'error');
    }

    wp_redirect(wc_get_cart_url());
    exit;
}

/**
 * Aplicar precio, peso y dimensiones personalizados al objeto del carrito
 */
add_action('woocommerce_before_calculate_totals', 'mecha_aplicar_datos_3d', 20, 1);
function mecha_aplicar_datos_3d($cart)
{
    if (is_admin() && !defined('DOING_AJAX')) {
        return;
    }

    if (did_action('woocommerce_before_calculate_totals') >= 2) {
        return;
    }

    foreach ($cart->get_cart() as $cart_item) {
        if (isset($cart_item['impresion_3d']) && $cart_item['impresion_3d'] === true) {

            // 1. Precio Personalizado
            if (isset($cart_item['custom_price']) && $cart_item['custom_price'] > 0) {
                $cart_item['data']->set_price($cart_item['custom_price']);
            }

            // 2. Peso para Envío (Convertir Gramos a Kg)
// WooCommerce espera KG por defecto en la mayoría de configuraciones, o la unidad que tenga configurada.
// Asumimos entrada en gramos y salida en Kg.
            if (isset($cart_item['weight']) && $cart_item['weight'] > 0) {
                $peso_kg = floatval($cart_item['weight']) / 1000;
                $cart_item['data']->set_weight($peso_kg);
            }

            // 3. Dimensiones para Envío (Convertir mm a Metros)
// Parsear string "20.5x10.1x5.0"
            if (isset($cart_item['dimensions']) && !empty($cart_item['dimensions'])) {
                $dims = explode('x', $cart_item['dimensions']);
                if (count($dims) === 3) {
                    $l_mm = floatval($dims[0]);
                    $w_mm = floatval($dims[1]);
                    $h_mm = floatval($dims[2]);

                    // Convertir mm a metros (dividir por 1000)
                    $cart_item['data']->set_length($l_mm / 1000);
                    $cart_item['data']->set_width($w_mm / 1000);
                    $cart_item['data']->set_height($h_mm / 1000);
                }
            }
        }
    }
}

/**
 * Mostrar detalles COMPLETOS de la impresión en el carrito y checkout
 */
add_filter('woocommerce_get_item_data', 'mecha_mostrar_datos_3d', 10, 2);
function mecha_mostrar_datos_3d($item_data, $cart_item)
{
    if (isset($cart_item['impresion_3d']) && $cart_item['impresion_3d'] === true) {
        $item_data[] = array('key' => 'Archivo', 'value' => esc_html($cart_item['file_name']));

        if (!empty($cart_item['material'])) {
            $item_data[] = array('key' => 'Material', 'value' => esc_html($cart_item['material']));
        }
        if (!empty($cart_item['color'])) {
            $item_data[] = array('key' => 'Color', 'value' => esc_html($cart_item['color']));
        }
        // Nuevos campos
        if (!empty($cart_item['layer_height'])) {
            $item_data[] = array('key' => 'Calidad', 'value' => esc_html($cart_item['layer_height']));
        }
        if (!empty($cart_item['infill'])) {
            // Formatear porcentaje si es necesario
            $infill_val = strpos($cart_item['infill'], '%') === false ? $cart_item['infill'] . '%' : $cart_item['infill'];
            $item_data[] = array('key' => 'Relleno', 'value' => esc_html($infill_val));
        }
        if (!empty($cart_item['dimensions'])) {
            // Mostrar dimensiones originales en mm para el usuario (más legible que metros)
            $item_data[] = array('key' => 'Dimensiones (mm)', 'value' => esc_html($cart_item['dimensions']));
        }

        if (!empty($cart_item['weight']) && $cart_item['weight'] > 0) {
            $item_data[] = array('key' => 'Peso estimado', 'value' => esc_html($cart_item['weight']) . 'g');
        }
    }
    return $item_data;
}

/**
 * Guardar TODOS los datos de impresión en el pedido (Backend)
 */
add_action('woocommerce_checkout_create_order_line_item', 'mecha_guardar_datos_3d_orden', 10, 4);
function mecha_guardar_datos_3d_orden($item, $cart_item_key, $values, $order)
{
    if (isset($values['impresion_3d']) && $values['impresion_3d'] === true) {
        $item->add_meta_data('_impresion_3d', 'yes', true);
        $item->add_meta_data('Archivo', $values['file_name'], true);
        $item->add_meta_data('_drive_url', $values['drive_url'], true);
        $item->add_meta_data('Material', $values['material'], true);
        $item->add_meta_data('Color', $values['color'], true);

        // Guardar nuevos datos
        if (!empty($values['layer_height']))
            $item->add_meta_data('Calidad', $values['layer_height'], true);
        if (!empty($values['infill']))
            $item->add_meta_data('Relleno', $values['infill'], true);
        if (!empty($values['dimensions']))
            $item->add_meta_data('Dimensiones (mm)', $values['dimensions'], true);

        if (!empty($values['weight']) && $values['weight'] > 0) {
            $item->add_meta_data('Peso', $values['weight'] . 'g', true);
        }



        $item->add_meta_data('_cotizacion_id', $values['cotizacion_id'], true);
    }
}

/**
 * Mostrar enlace al archivo en el admin del pedido (Sin cambios, solo referencia)
 */
add_action('woocommerce_after_order_itemmeta', 'mecha_mostrar_link_archivo_admin', 10, 3);
function mecha_mostrar_link_archivo_admin($item_id, $item, $product)
{
    if (!is_admin())
        return;

    $drive_url = $item->get_meta('_drive_url');
    if (!empty($drive_url)) {
        echo '<p><a href="' . esc_url($drive_url) . '" target="_blank" class="button">📥 Descargar archivo 3D</a></p>';
    }
}

add_filter('woocommerce_add_cart_item_data', 'mecha_unique_cart_item_3d', 10, 2);
function mecha_unique_cart_item_3d($cart_item_data, $product_id)
{
    if (isset($cart_item_data['unique_key'])) {
        $cart_item_data['unique_key'] = $cart_item_data['unique_key'];
    }
    return $cart_item_data;
}
?>