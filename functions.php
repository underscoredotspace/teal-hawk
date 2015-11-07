<?php
function escape_mySQL($data) {
        if ( !isset($data) or empty($data) ) return '';
        if ( is_numeric($data) ) return $data;

        $non_displayables = array(
            '/%0[0-8bcef]/',            // url encoded 00-08, 11, 12, 14, 15
            '/%1[0-9a-f]/',             // url encoded 16-31
            '/[\x00-\x08]/',            // 00-08
            '/\x0b/',                   // 11
            '/\x0c/',                   // 12
            '/[\x0e-\x1f]/'             // 14-31
        );
        foreach ( $non_displayables as $regex )
            $data = preg_replace( $regex, '', $data );
        $data = str_replace("'", "''", $data );
        return $data;
    }

function linkify($status_text) {
  // linkify URLs
  $status_text = preg_replace(
    '/(https?:\/\/\S+)/',
    '<a href="\1">\1</a>',
    $status_text
  );

  // linkify twitter users
  $status_text = preg_replace(
    '/@(\w+)/',
    '<a href="http://star.underscore.space/?q=\1">@\1</a>',
    $status_text
  );

  // linkify tags
  $status_text = preg_replace(
    '/(^|\s)#(\w+)/',
    '\1<a href="http://star.underscore.space/?q=%23\2">#\2</a>',
    $status_text
  );
  return $status_text;
}


function time_ago($datetime, $full = false) {
    $now = new DateTime;
    $ago = new DateTime($datetime);
    $diff = $now->diff($ago);

    $diff->w = floor($diff->d / 7);
    $diff->d -= $diff->w * 7;

    $string = array(
        'y' => 'year',
        'm' => 'month',
        'w' => 'week',
        'd' => 'day',
        'h' => 'hour',
        'i' => 'minute',
        's' => 'second',
    );
    foreach ($string as $k => &$v) {
        if ($diff->$k) {
            $v = $diff->$k . ' ' . $v . ($diff->$k > 1 ? 's' : '');
        } else {
            unset($string[$k]);
        }
    }

    if (!$full) $string = array_slice($string, 0, 1);
    return $string ? implode(', ', $string) . ' ago' : 'just now';
}
?>
