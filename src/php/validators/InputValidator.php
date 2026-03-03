<?php
/**
 * Input Validator
 * Input validation and sanitization
 */
class InputValidator {
    
    /**
     * Integer validation
     */
    public static function validateInteger($value, $min = null, $max = null) {
        $filtered = filter_var($value, FILTER_VALIDATE_INT);
        
        if ($filtered === false) {
            throw new InvalidArgumentException("Value must be an integer");
        }
        
        if ($min !== null && $filtered < $min) {
            throw new InvalidArgumentException("Value must be at least $min");
        }
        
        if ($max !== null && $filtered > $max) {
            throw new InvalidArgumentException("Value must be at most $max");
        }
        
        return $filtered;
    }
    
    /**
     * String validation
     */
    public static function validateString($value, $maxLength = 255) {
        if (!is_string($value)) {
            $value = (string)$value;
        }
        
        $sanitized = trim($value);
        
        if (mb_strlen($sanitized, 'UTF-8') > $maxLength) {
            throw new InvalidArgumentException("String too long (max: $maxLength)");
        }
        
        return $sanitized;
    }
    
    /**
     * Email validation
     */
    public static function validateEmail($email) {
        $filtered = filter_var($email, FILTER_VALIDATE_EMAIL);
        
        if ($filtered === false) {
            throw new InvalidArgumentException("Invalid email format");
        }
        
        return $filtered;
    }
    
    /**
     * URL validation
     */
    public static function validateUrl($url) {
        $filtered = filter_var($url, FILTER_VALIDATE_URL);
        
        if ($filtered === false) {
            throw new InvalidArgumentException("Invalid URL format");
        }
        
        return $filtered;
    }
    
    /**
     * Date validation
     */
    public static function validateDate($date) {
        $d = DateTime::createFromFormat('Y-m-d', $date);
        
        if (!$d || $d->format('Y-m-d') !== $date) {
            throw new InvalidArgumentException("Invalid date format. Expected YYYY-MM-DD");
        }
        
        return $date;
    }
    
    /**
     * Boolean validation
     */
    public static function validateBoolean($value) {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) !== null;
    }
    
    /**
     * Album ID validation
     */
    public static function validateAlbumId($albumId) {
        return self::validateInteger($albumId, 1);
    }
    
    /**
     * User ID validation
     */
    public static function validateUserId($userId) {
        return self::validateInteger($userId, 1);
    }
    
    /**
     * Rating validation
     */
    public static function validateRating($rating) {
        return self::validateInteger($rating, 0, 10);
    }
    
    /**
     * Rating ID validation
     */
    public static function validateRatingId($ratingId) {
        return self::validateInteger($ratingId, 1);
    }
    
    /**
     * Username validation
     */
    public static function validateUsername($username) {
        $username = self::validateString($username, 50);
        
        if (strlen($username) < 3) {
            throw new InvalidArgumentException("Username must be at least 3 characters");
        }
        
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $username)) {
            throw new InvalidArgumentException("Username can only contain letters, numbers, underscore and dash");
        }
        
        return $username;
    }
    
    /**
     * Password validation
     */
    public static function validatePassword($password) {
        if (strlen($password) < 6) {
            throw new InvalidArgumentException("Password must be at least 6 characters");
        }
        
        if (strlen($password) > 255) {
            throw new InvalidArgumentException("Password is too long");
        }
        
        return $password;
    }
    
    /**
     * Display name validation
     */
    public static function validateDisplayName($displayName) {
        $name = self::validateString($displayName, 100);
        
        if (empty($name)) {
            throw new InvalidArgumentException("Display name cannot be empty");
        }
        
        return $name;
    }
    
    /**
     * Album name validation
     */
    public static function validateAlbumName($albumName) {
        return self::validateString($albumName, 255);
    }
    
    /**
     * Artist name validation
     */
    public static function validateArtistName($artistName) {
        return self::validateString($artistName, 255);
    }
    
    /**
     * Genre validation
     */
    public static function validateGenre($genre) {
        if (empty($genre)) {
            return null;
        }
        return self::validateString($genre, 100);
    }
    
    /**
     * Song name validation
     */
    public static function validateSongName($songName) {
        if (empty($songName)) {
            return null;
        }
        return self::validateString($songName, 255);
    }
    
    /**
     * Review validation
     */
    public static function validateReview($review) {
        if (empty($review)) {
            return null;
        }
        return self::validateString($review, 5000);
    }
    
    /**
     * Spotify link validation
     */
    public static function validateSpotifyLink($link) {
        $link = self::validateUrl($link);
        
        if (!preg_match('/spotify\.com/', $link)) {
            throw new InvalidArgumentException("Must be a valid Spotify link");
        }
        
        return $link;
    }
}
?>
