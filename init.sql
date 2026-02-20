-- GymTrack Database Initialization Script
-- Version: 1.0
-- Description: Creates tables for Users, Library, Scheduler, and Social modules.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS GymTrack;
USE GymTrack;

-- ==========================================
-- 1. USER MANAGEMENT & PROFILE
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    reputation_score DECIMAL(3, 2) DEFAULT 0.00 COMMENT 'Cached average of all content ratings',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INT PRIMARY KEY,
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    birth_date DATE,
    gender ENUM('male', 'female', 'other'),
    activity_level ENUM('sedentary', 'light', 'moderate', 'active', 'very_active'),
    bmr DECIMAL(6,2) COMMENT 'Basal Metabolic Rate calculated via Harris-Benedict or similar',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 2. LIBRARY (CONTENT TEMPLATES)
-- ==========================================

CREATE TABLE IF NOT EXISTS exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    muscle_group VARCHAR(50),
    video_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    calories_per_100g DECIMAL(6,2),
    protein_per_100g DECIMAL(5,2),
    carbs_per_100g DECIMAL(5,2),
    fat_per_100g DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS routine_exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    routine_id INT NOT NULL,
    exercise_id INT NOT NULL,
    day_of_week INT COMMENT '1=Monday, 7=Sunday, or Day 1, Day 2 for splits',
    order_index INT,
    target_sets INT,
    target_reps_min INT,
    target_reps_max INT,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diet_foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    diet_id INT NOT NULL,
    food_id INT NOT NULL,
    meal_name VARCHAR(50) COMMENT 'Breakfast, Lunch, etc.',
    quantity_grams DECIMAL(6,2),
    FOREIGN KEY (diet_id) REFERENCES diets(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
);

-- ==========================================
-- 3. SCHEDULER & TRACKING (INSTANCES)
-- ==========================================

CREATE TABLE IF NOT EXISTS scheduled_workouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    routine_id INT COMMENT 'Link to original template if applicable',
    scheduled_date DATE NOT NULL,
    status ENUM('pending', 'completed', 'skipped') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS workout_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scheduled_workout_id INT NOT NULL,
    exercise_id INT NOT NULL,
    set_number INT,
    weight_kg DECIMAL(6,2),
    reps INT,
    rpe INT COMMENT 'Rate of Perceived Exertion (1-10)',
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scheduled_workout_id) REFERENCES scheduled_workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- ==========================================
-- 4. SOCIAL & GAMIFICATION
-- ==========================================

CREATE TABLE IF NOT EXISTS content_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rater_id INT NOT NULL,
    content_type ENUM('routine', 'diet') NOT NULL,
    content_id INT NOT NULL,
    score TINYINT CHECK (score BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_rating (rater_id, content_type, content_id),
    FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 5. TRIGGERS (REPUTATION LOGIC)
-- ==========================================
-- Note: In a real production app, this might be handled by application logic 
-- to avoid complex triggers, but for this requirement, we'll outline the logic.

DELIMITER //

CREATE TRIGGER after_rating_insert
AFTER INSERT ON content_ratings
FOR EACH ROW
BEGIN
    -- 1. Update Routine/Diet Average
    IF NEW.content_type = 'routine' THEN
        UPDATE routines 
        SET average_rating = (SELECT AVG(score) FROM content_ratings WHERE content_type = 'routine' AND content_id = NEW.content_id),
            rating_count = (SELECT COUNT(*) FROM content_ratings WHERE content_type = 'routine' AND content_id = NEW.content_id)
        WHERE id = NEW.content_id;
        
        -- 2. Update Creator Reputation (Simplified: Average of their routines' averages)
        -- Note: This is a heavy operation for a trigger. In production, use a scheduled job.
        -- For this demo, we assume the application handles the user reputation update 
        -- or we do a simplified update here.
    ELSEIF NEW.content_type = 'diet' THEN
        UPDATE diets 
        SET average_rating = (SELECT AVG(score) FROM content_ratings WHERE content_type = 'diet' AND content_id = NEW.content_id),
            rating_count = (SELECT COUNT(*) FROM content_ratings WHERE content_type = 'diet' AND content_id = NEW.content_id)
        WHERE id = NEW.content_id;
    END IF;
END;
//

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;
