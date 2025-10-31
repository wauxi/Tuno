<?php
/**
 * Input Validator
 * Валидация и санитизация входных данных
 */
class InputValidator {
    
    /**
     * Валидация целого числа
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
     * Валидация строки
     */
    public static function validateString($value, $maxLength = 255) {
        if (!is_string($value)) {
            $value = (string)$value;
        }
        
        $sanitized = htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
        
        if (strlen($sanitized) > $maxLength) {
            throw new InvalidArgumentException("String too long (max: $maxLength)");
        }
        
        return $sanitized;
    }
    
    /**
     * Валидация email
     */
    public static function validateEmail($email) {
        $filtered = filter_var($email, FILTER_VALIDATE_EMAIL);
        
        if ($filtered === false) {
            throw new InvalidArgumentException("Invalid email format");
        }
        
        return $filtered;
    }
    
    /**
     * Валидация URL
     */
    public static function validateUrl($url) {
        $filtered = filter_var($url, FILTER_VALIDATE_URL);
        
        if ($filtered === false) {
            throw new InvalidArgumentException("Invalid URL format");
        }
        
        return $filtered;
    }
    
    /**
     * Валидация даты
     */
    public static function validateDate($date) {
        $d = DateTime::createFromFormat('Y-m-d', $date);
        
        if (!$d || $d->format('Y-m-d') !== $date) {
            throw new InvalidArgumentException("Invalid date format. Expected YYYY-MM-DD");
        }
        
        return $date;
    }
    
    /**
     * Валидация boolean
     */
    public static function validateBoolean($value) {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) !== null;
    }
    
    /**
     * Валидация ID альбома
     */
    public static function validateAlbumId($albumId) {
        return self::validateInteger($albumId, 1);
    }
    
    /**
     * Валидация ID пользователя
     */
    public static function validateUserId($userId) {
        return self::validateInteger($userId, 1);
    }
    
    /**
     * Валидация рейтинга
     */
    public static function validateRating($rating) {
        return self::validateInteger($rating, 0, 10);
    }
    
    /**
     * Валидация ID рейтинга
     */
    public static function validateRatingId($ratingId) {
        return self::validateInteger($ratingId, 1);
    }
    
    /**
     * Валидация имени пользователя
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
     * Валидация пароля
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
     * Валидация отображаемого имени
     */
    public static function validateDisplayName($displayName) {
        $name = self::validateString($displayName, 100);
        
        if (empty($name)) {
            throw new InvalidArgumentException("Display name cannot be empty");
        }
        
        return $name;
    }
    
    /**
     * Валидация названия альбома
     */
    public static function validateAlbumName($albumName) {
        return self::validateString($albumName, 255);
    }
    
    /**
     * Валидация имени исполнителя
     */
    public static function validateArtistName($artistName) {
        return self::validateString($artistName, 255);
    }
    
    /**
     * Валидация жанра
     */
    public static function validateGenre($genre) {
        if (empty($genre)) {
            return null;
        }
        return self::validateString($genre, 100);
    }
    
    /**
     * Валидация названия песни
     */
    public static function validateSongName($songName) {
        if (empty($songName)) {
            return null;
        }
        return self::validateString($songName, 255);
    }
    
    /**
     * Валидация отзыва
     */
    public static function validateReview($review) {
        if (empty($review)) {
            return null;
        }
        return self::validateString($review, 5000);
    }
    
    /**
     * Валидация Spotify ссылки
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
