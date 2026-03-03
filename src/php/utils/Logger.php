<?php
/**
 * Logger Utility
 * Centralized logging with levels
 */
class Logger {
    // Log levels
    const LEVEL_DEBUG = 0;
    const LEVEL_INFO = 1;
    const LEVEL_WARNING = 2;
    const LEVEL_ERROR = 3;
    const LEVEL_CRITICAL = 4;
    
    private static $currentLevel = self::LEVEL_INFO;
    private static $isDevelopment = true;
    
    /**
     * Set log level
     */
    public static function setLevel($level) {
        self::$currentLevel = $level;
    }
    
    /**
     * Set mode (development/production)
     */
    public static function setDevelopmentMode($isDev) {
        self::$isDevelopment = $isDev;
    }
    
    /**
     * DEBUG - detailed information for debugging
     */
    public static function debug($message, $context = []) {
        if (self::$currentLevel <= self::LEVEL_DEBUG && self::$isDevelopment) {
            self::log('DEBUG', $message, $context);
        }
    }
    
    /**
     * INFO - informational messages
     */
    public static function info($message, $context = []) {
        if (self::$currentLevel <= self::LEVEL_INFO) {
            self::log('INFO', $message, $context);
        }
    }
    
    /**
     * WARNING - warnings
     */
    public static function warning($message, $context = []) {
        if (self::$currentLevel <= self::LEVEL_WARNING) {
            self::log('WARNING', $message, $context);
        }
    }
    
    /**
     * ERROR - errors
     */
    public static function error($message, $context = []) {
        if (self::$currentLevel <= self::LEVEL_ERROR) {
            self::log('ERROR', $message, $context);
        }
    }
    
    /**
     * CRITICAL - critical errors
     */
    public static function critical($message, $context = []) {
        self::log('CRITICAL', $message, $context);
    }
    
    /**
     * Internal logging method
     */
    private static function log($level, $message, $context) {
        $timestamp = date('Y-m-d H:i:s');
        
        // Format context
        $contextStr = !empty($context) ? ' ' . json_encode($context, JSON_UNESCAPED_UNICODE) : '';
        
        // Format message
        $logMessage = sprintf(
            '[%s] [%s] %s%s',
            $timestamp,
            $level,
            $message,
            $contextStr
        );
        
        error_log($logMessage);
    }
    
    /**
     * Log SQL queries (dev only)
     */
    public static function sql($query, $params = [], $executionTime = null) {
        if (!self::$isDevelopment) return;
        
        $context = ['params' => $params];
        if ($executionTime !== null) {
            $context['execution_time'] = $executionTime . 'ms';
        }
        
        self::debug("SQL: " . $query, $context);
    }
    
    /**
     * Log API requests
     */
    public static function apiRequest($method, $endpoint, $params = []) {
        $context = [
            'method' => $method,
            'endpoint' => $endpoint
        ];
        
        if (!empty($params)) {
            $context['params'] = $params;
        }
        
        self::info("API Request", $context);
    }
    
    /**
     * Log API responses
     */
    public static function apiResponse($endpoint, $statusCode, $responseTime = null) {
        $context = [
            'endpoint' => $endpoint,
            'status' => $statusCode
        ];
        
        if ($responseTime !== null) {
            $context['response_time'] = $responseTime . 'ms';
        }
        
        if ($statusCode >= 400) {
            self::warning("API Response Error", $context);
        } else {
            self::info("API Response", $context);
        }
    }
    
    /**
     * Log authentication events
     */
    public static function auth($action, $username, $success = true) {
        $level = $success ? 'info' : 'warning';
        $message = sprintf(
            "Auth %s: %s - %s",
            $action,
            $username,
            $success ? 'Success' : 'Failed'
        );
        // Safely call the static logging method by name.
        if (method_exists(__CLASS__, $level)) {
            self::{$level}($message, []);
        } else {
            // Fallback to info when method doesn't exist
            self::info($message, []);
        }
    }
}
?>
