<?php

$method = $GLOBALS['method'];

if ($method !== 'GET') {
    error_response('Method not allowed', 405);
}

success_response([]);
