-- GymTrack Seed Data Script
-- Version: 1.0
-- Description: Populates the database with initial Exercises, Foods, and Official Routines.

SET NAMES utf8mb4;
USE GymTrack;

-- ==========================================
-- 1. CREATE ADMIN USER
-- ==========================================
INSERT INTO users (username, email, password_hash, reputation_score) VALUES 
('GymTrackAdmin', 'admin@gymtrack.com', 'HASHED_PASSWORD_HERE', 5.00);

SET @admin_id = LAST_INSERT_ID();

-- ==========================================
-- 2. INSERT EXERCISES (The Essentials)
-- ==========================================
INSERT INTO exercises (name, muscle_group, description) VALUES 
-- Chest
('Press de Banca con Barra', 'Pecho', 'El rey de los ejercicios de empuje.'),
('Press Inclinado con Mancuernas', 'Pecho', 'Enfasis en la porción clavicular.'),
('Aperturas con Mancuernas', 'Pecho', 'Ejercicio de aislamiento.'),
('Fondos en Paralelas', 'Pecho', 'Excelente para pecho bajo y tríceps.'),
-- Back
('Dominadas', 'Espalda', 'Ejercicio fundamental de tracción vertical.'),
('Remo con Barra', 'Espalda', 'Constructor de densidad de espalda.'),
('Jalón al Pecho', 'Espalda', 'Alternativa a las dominadas.'),
('Remo Gironda', 'Espalda', 'Remo sentado en polea.'),
-- Legs
('Sentadilla con Barra', 'Piernas', 'El rey de los ejercicios de pierna.'),
('Prensa de Piernas', 'Piernas', 'Para mover grandes cargas sin fatiga axial.'),
('Peso Muerto Rumano', 'Isquios', 'Enfasis en la cadena posterior.'),
('Extensiones de Cuádriceps', 'Piernas', 'Aislamiento de cuádriceps.'),
('Curl Femoral Tumbado', 'Isquios', 'Aislamiento de isquios.'),
('Elevación de Talones', 'Gemelos', 'Para desarrollar los gemelos.'),
-- Shoulders
('Press Militar', 'Hombros', 'Empuje vertical básico.'),
('Elevaciones Laterales', 'Hombros', 'Para la cabeza lateral del deltoides.'),
('Pájaros (Elevaciones Posteriores)', 'Hombros', 'Para el deltoides posterior.'),
-- Arms
('Curl con Barra', 'Bíceps', 'Constructor de masa para bíceps.'),
('Curl Martillo', 'Bíceps', 'Enfasis en braquial y antebrazo.'),
('Press Francés', 'Tríceps', 'Aislamiento de tríceps.'),
('Extensiones de Tríceps en Polea', 'Tríceps', 'Ejercicio de bombeo para tríceps.'),
-- Core
('Plancha Abdominal', 'Abdominales', 'Estabilidad del core.'),
('Crunch Abdominal', 'Abdominales', 'Flexión de tronco.');

-- ==========================================
-- 3. INSERT FOODS (Basic Staples)
-- ==========================================
INSERT INTO foods (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g) VALUES
('Pechuga de Pollo', 165, 31, 0, 3.6),
('Arroz Blanco Cocido', 130, 2.7, 28, 0.3),
('Huevo Entero', 155, 13, 1.1, 11),
('Avena', 389, 16.9, 66, 6.9),
('Ternera Magra', 250, 26, 0, 15),
('Salmón', 208, 20, 0, 13),
('Patata Cocida', 87, 1.9, 20, 0.1),
('Plátano', 89, 1.1, 22.8, 0.3),
('Proteína Whey (Polvo)', 370, 80, 4, 3),
('Aceite de Oliva', 884, 0, 0, 100);

-- ==========================================
-- 4. INSERT ROUTINES
-- ==========================================

-- ------------------------------------------
-- RUTINA 1: FULL BODY (Principiante)
-- ------------------------------------------
INSERT INTO routines (creator_id, name, description, is_public, average_rating) VALUES 
(@admin_id, 'Full Body - Principiante', 'Rutina de cuerpo completo ideal para empezar. Realizar 3 veces por semana (Lunes, Miércoles, Viernes).', TRUE, 4.8);
SET @r_fb_id = LAST_INSERT_ID();

INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max) VALUES
(@r_fb_id, (SELECT id FROM exercises WHERE name='Sentadilla con Barra'), 1, 3, 8, 10),
(@r_fb_id, (SELECT id FROM exercises WHERE name='Press de Banca con Barra'), 2, 3, 8, 10),
(@r_fb_id, (SELECT id FROM exercises WHERE name='Remo con Barra'), 3, 3, 8, 10),
(@r_fb_id, (SELECT id FROM exercises WHERE name='Press Militar'), 4, 3, 10, 12),
(@r_fb_id, (SELECT id FROM exercises WHERE name='Jalón al Pecho'), 5, 3, 10, 12),
(@r_fb_id, (SELECT id FROM exercises WHERE name='Plancha Abdominal'), 6, 3, 0, 0); -- 0 reps implies time based usually, but schema is int.

-- ------------------------------------------
-- RUTINA 2: PUSH / EMPUJE (Intermedio - Día 1)
-- ------------------------------------------
INSERT INTO routines (creator_id, name, description, is_public, average_rating) VALUES 
(@admin_id, 'PPL - Día de Empuje (Push)', 'Enfoque en Pecho, Hombros y Tríceps. Parte de la rutina Push-Pull-Legs.', TRUE, 4.9);
SET @r_push_id = LAST_INSERT_ID();

INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max) VALUES
(@r_push_id, (SELECT id FROM exercises WHERE name='Press de Banca con Barra'), 1, 4, 6, 8),
(@r_push_id, (SELECT id FROM exercises WHERE name='Press Militar'), 2, 3, 8, 10),
(@r_push_id, (SELECT id FROM exercises WHERE name='Press Inclinado con Mancuernas'), 3, 3, 10, 12),
(@r_push_id, (SELECT id FROM exercises WHERE name='Elevaciones Laterales'), 4, 4, 12, 15),
(@r_push_id, (SELECT id FROM exercises WHERE name='Extensiones de Tríceps en Polea'), 5, 3, 12, 15);

-- ------------------------------------------
-- RUTINA 3: PULL / TRACCIÓN (Intermedio - Día 2)
-- ------------------------------------------
INSERT INTO routines (creator_id, name, description, is_public, average_rating) VALUES 
(@admin_id, 'PPL - Día de Tracción (Pull)', 'Enfoque en Espalda y Bíceps. Parte de la rutina Push-Pull-Legs.', TRUE, 4.9);
SET @r_pull_id = LAST_INSERT_ID();

INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max) VALUES
(@r_pull_id, (SELECT id FROM exercises WHERE name='Peso Muerto Rumano'), 1, 3, 8, 10),
(@r_pull_id, (SELECT id FROM exercises WHERE name='Dominadas'), 2, 4, 6, 8),
(@r_pull_id, (SELECT id FROM exercises WHERE name='Remo Gironda'), 3, 3, 10, 12),
(@r_pull_id, (SELECT id FROM exercises WHERE name='Pájaros (Elevaciones Posteriores)'), 4, 3, 15, 20),
(@r_pull_id, (SELECT id FROM exercises WHERE name='Curl con Barra'), 5, 3, 10, 12),
(@r_pull_id, (SELECT id FROM exercises WHERE name='Curl Martillo'), 6, 3, 12, 15);

-- ------------------------------------------
-- RUTINA 4: LEGS / PIERNA (Intermedio - Día 3)
-- ------------------------------------------
INSERT INTO routines (creator_id, name, description, is_public, average_rating) VALUES 
(@admin_id, 'PPL - Día de Pierna (Legs)', 'Enfoque total en el tren inferior. Parte de la rutina Push-Pull-Legs.', TRUE, 4.7);
SET @r_legs_id = LAST_INSERT_ID();

INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max) VALUES
(@r_legs_id, (SELECT id FROM exercises WHERE name='Sentadilla con Barra'), 1, 4, 6, 8),
(@r_legs_id, (SELECT id FROM exercises WHERE name='Prensa de Piernas'), 2, 3, 10, 12),
(@r_legs_id, (SELECT id FROM exercises WHERE name='Extensiones de Cuádriceps'), 3, 3, 15, 20),
(@r_legs_id, (SELECT id FROM exercises WHERE name='Curl Femoral Tumbado'), 4, 3, 12, 15),
(@r_legs_id, (SELECT id FROM exercises WHERE name='Elevación de Talones'), 5, 4, 15, 20);

-- ------------------------------------------
-- RUTINA 5: ARNOLD SPLIT - PECHO Y ESPALDA (Avanzado)
-- ------------------------------------------
INSERT INTO routines (creator_id, name, description, is_public, average_rating) VALUES 
(@admin_id, 'Arnold Split - Pecho y Espalda', 'El clásico split antagonista de Arnold Schwarzenegger. Alta intensidad.', TRUE, 5.0);
SET @r_arnold1_id = LAST_INSERT_ID();

INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max) VALUES
(@r_arnold1_id, (SELECT id FROM exercises WHERE name='Press de Banca con Barra'), 1, 5, 6, 10),
(@r_arnold1_id, (SELECT id FROM exercises WHERE name='Dominadas'), 2, 5, 6, 10),
(@r_arnold1_id, (SELECT id FROM exercises WHERE name='Press Inclinado con Mancuernas'), 3, 4, 8, 12),
(@r_arnold1_id, (SELECT id FROM exercises WHERE name='Remo con Barra'), 4, 4, 8, 12),
(@r_arnold1_id, (SELECT id FROM exercises WHERE name='Aperturas con Mancuernas'), 5, 3, 12, 15),
(@r_arnold1_id, (SELECT id FROM exercises WHERE name='Remo Gironda'), 6, 3, 12, 15);

