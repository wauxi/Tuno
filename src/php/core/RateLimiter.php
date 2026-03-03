<?php
/**
 * Simple file-based rate limiter
 * Rate limiting by key (IP + action)
 */
class RateLimiter {
    
    private static function getFilePath($key) {
        return sys_get_temp_dir() . '/ratelimit_' . md5($key);
    }
    
    /**
     * Check if the action is allowed within the rate limit
     */
    public static function check($key, $maxAttempts, $windowSeconds) {
        $file = self::getFilePath($key);
        $now = time();
        
        if (!file_exists($file)) {
            return true;
        }
        
        $data = json_decode(@file_get_contents($file), true);
        if (!$data || ($now - $data['first_attempt']) > $windowSeconds) {
            return true;
        }
        
        return $data['attempts'] < $maxAttempts;
    }
    
    /**
     * Record an attempt
     */
    public static function hit($key, $windowSeconds) {
        $file = self::getFilePath($key);
        $now = time();
        
        $data = ['first_attempt' => $now, 'attempts' => 1];
        
        if (file_exists($file)) {
            $existing = json_decode(@file_get_contents($file), true);
            if ($existing && ($now - $existing['first_attempt']) <= $windowSeconds) {
                $data = $existing;
                $data['attempts']++;
            }
        }
        
        file_put_contents($file, json_encode($data), LOCK_EX);
    }
    
    /**
     * Reset attempts (e.g. after successful login)
     */
    public static function reset($key) {
        $file = self::getFilePath($key);
        if (file_exists($file)) {
            @unlink($file);
        }
    }
}
