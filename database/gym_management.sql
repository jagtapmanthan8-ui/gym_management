-- Gym Management System: MySQL schema + sample data
-- (Attendance is intentionally not part of this project.)
CREATE DATABASE IF NOT EXISTS gym_management;
USE gym_management;

CREATE TABLE Admin (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash CHAR(64) NOT NULL
);

CREATE TABLE Trainers (
  trainer_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone CHAR(10) NOT NULL UNIQUE,
  email VARCHAR(100),
  specialization VARCHAR(100),
  salary DECIMAL(10,2) DEFAULT 0 CHECK (salary >= 0)
);

CREATE TABLE Workout_Plans (
  workout_id INT AUTO_INCREMENT PRIMARY KEY,
  plan_name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  exercises TEXT,
  duration VARCHAR(50)
);

CREATE TABLE Membership_Plans (
  plan_id INT AUTO_INCREMENT PRIMARY KEY,
  plan_name VARCHAR(50) NOT NULL UNIQUE,
  duration_days INT NOT NULL CHECK (duration_days > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE Members (
  member_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone CHAR(10) NOT NULL UNIQUE,
  email VARCHAR(100),
  gender ENUM('Male','Female','Other') NOT NULL,
  age INT NOT NULL CHECK (age BETWEEN 10 AND 100),
  address VARCHAR(255),
  trainer_id INT NULL,
  FOREIGN KEY (trainer_id) REFERENCES Trainers(trainer_id) ON DELETE SET NULL
);

CREATE TABLE Member_Memberships (
  membership_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  plan_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,            -- start_date + plan duration
  total_fee DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (member_id) REFERENCES Members(member_id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES Membership_Plans(plan_id) ON DELETE RESTRICT
);

CREATE TABLE Payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  membership_id INT NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL CHECK (amount_paid > 0),
  payment_date DATE NOT NULL,
  method ENUM('Cash','UPI','Card') NOT NULL,
  FOREIGN KEY (membership_id) REFERENCES Member_Memberships(membership_id) ON DELETE CASCADE
);

CREATE TABLE Member_Workout_Plans (
  member_id INT NOT NULL,
  workout_id INT NOT NULL,
  assigned_date DATE NOT NULL,
  PRIMARY KEY (member_id, workout_id),
  FOREIGN KEY (member_id) REFERENCES Members(member_id) ON DELETE CASCADE,
  FOREIGN KEY (workout_id) REFERENCES Workout_Plans(workout_id) ON DELETE CASCADE
);

-- Balance and payment status are calculated, never stored
CREATE VIEW Membership_Summary AS
SELECT mm.membership_id, m.name AS member_name, p.plan_name, mm.start_date, mm.end_date,
  IF(mm.end_date < CURDATE(), 'Expired', 'Active') AS membership_status,
  mm.total_fee, mm.discount, IFNULL(SUM(pay.amount_paid),0) AS paid,
  mm.total_fee - mm.discount - IFNULL(SUM(pay.amount_paid),0) AS balance,
  CASE WHEN mm.total_fee - mm.discount - IFNULL(SUM(pay.amount_paid),0) <= 0 THEN 'Paid'
       WHEN IFNULL(SUM(pay.amount_paid),0) > 0 THEN 'Partially Paid' ELSE 'Pending' END AS payment_status
FROM Member_Memberships mm
JOIN Members m ON m.member_id = mm.member_id
JOIN Membership_Plans p ON p.plan_id = mm.plan_id
LEFT JOIN Payments pay ON pay.membership_id = mm.membership_id
GROUP BY mm.membership_id;

-- Sample data (login: admin / admin123)
INSERT INTO Admin (username, password_hash) VALUES ('admin', SHA2('admin123',256));
INSERT INTO Membership_Plans (plan_name,duration_days,price) VALUES ('1 Month',30,1500),('3 Months',90,4000),('6 Months',180,7000),('1 Year',365,12000);
INSERT INTO Trainers (name,phone,email,specialization,salary) VALUES
 ('Rohit Sharma','9876500001','rohit@gym.com','Strength Training',25000),
 ('Neha Patil','9876500002','neha@gym.com','Yoga & Cardio',22000),
 ('Aman Verma','9876500003','aman@gym.com','CrossFit',28000);
INSERT INTO Workout_Plans (plan_name,description,exercises,duration) VALUES
 ('Beginner Full Body','Easy 3-day routine','Squats 3x12, Push-ups 3x10, Plank 3x30s','4 weeks'),
 ('Fat Loss Cardio','Cardio focused plan','Treadmill 20 min, Cycling 15 min, Jump rope','6 weeks'),
 ('Muscle Gain','Heavy lifting split','Bench press 4x8, Deadlift 4x6, Pull-ups 3x8','8 weeks');
INSERT INTO Members (name,phone,email,gender,age,address,trainer_id) VALUES
 ('Aarav Mehta','9000000001','aarav@mail.com','Male',22,'Pune',1),
 ('Priya Singh','9000000002','priya@mail.com','Female',27,'Pimpri',2),
 ('Rahul Desai','9000000003','rahul@mail.com','Male',31,'Nigdi',3),
 ('Sneha Kulkarni','9000000004','sneha@mail.com','Female',24,'Chinchwad',2),
 ('Karan Joshi','9000000005','karan@mail.com','Male',29,'Akurdi',1);
INSERT INTO Member_Memberships (member_id,plan_id,start_date,end_date,total_fee,discount) VALUES
 (1,2,CURDATE()-INTERVAL 20 DAY, CURDATE()-INTERVAL 20 DAY + INTERVAL 90 DAY,4000,0),
 (2,1,CURDATE()-INTERVAL 45 DAY, CURDATE()-INTERVAL 45 DAY + INTERVAL 30 DAY,1500,0),
 (3,4,CURDATE()-INTERVAL 100 DAY,CURDATE()-INTERVAL 100 DAY + INTERVAL 365 DAY,12000,1000),
 (4,3,CURDATE()-INTERVAL 10 DAY, CURDATE()-INTERVAL 10 DAY + INTERVAL 180 DAY,7000,0),
 (5,1,CURDATE()-INTERVAL 5 DAY,  CURDATE()-INTERVAL 5 DAY + INTERVAL 30 DAY,1500,0);
INSERT INTO Payments (membership_id,amount_paid,payment_date,method) VALUES
 (1,4000,CURDATE()-INTERVAL 20 DAY,'UPI'),(2,1500,CURDATE()-INTERVAL 45 DAY,'Cash'),
 (3,6000,CURDATE()-INTERVAL 100 DAY,'Card'),(5,1500,CURDATE()-INTERVAL 5 DAY,'Cash');
INSERT INTO Member_Workout_Plans VALUES (1,1,CURDATE()),(2,2,CURDATE()),(3,3,CURDATE()),(4,2,CURDATE()),(5,1,CURDATE());
