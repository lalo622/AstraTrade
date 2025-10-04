CREATE DATABASE RaoVatDB;
USE RaoVatDB;

-- Bảng User
CREATE TABLE User (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(100) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Email VARCHAR(150) UNIQUE NOT NULL,
    Phone VARCHAR(20),
    Address VARCHAR(255),
    Role ENUM('Admin','Member') DEFAULT 'Member',
    isVIP BOOLEAN DEFAULT FALSE,
    IsActivated BOOLEAN DEFAULT TRUE
);

-- Bảng Category
CREATE TABLE Category (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Description TEXT
);

-- Bảng Advertisement
CREATE TABLE Advertisement (
    AdvertisementID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    Price DECIMAL(15,2),
    AdType ENUM('Buy','Sell','Rent','Service') NOT NULL,
    Image VARCHAR(255),
    PostDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Active','Inactive','Deleted') DEFAULT 'Active',
    UserID INT,
    CategoryID INT,
    FOREIGN KEY (UserID) REFERENCES User(UserID),
    FOREIGN KEY (CategoryID) REFERENCES Category(CategoryID)
);

-- Bảng Feedback (Rating + Comment)
CREATE TABLE Feedback (
    FeedbackID INT AUTO_INCREMENT PRIMARY KEY,
    Score INT CHECK(Score BETWEEN 1 AND 5),
    Comment TEXT,
    DateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    UserID INT,
    AdvertisementID INT,
    FOREIGN KEY (UserID) REFERENCES User(UserID),
    FOREIGN KEY (AdvertisementID) REFERENCES Advertisement(AdvertisementID),
    UNIQUE (UserID, AdvertisementID) -- 1 user chỉ đánh giá 1 tin 1 lần
);

-- Bảng Report
CREATE TABLE Report (
    ReportID INT AUTO_INCREMENT PRIMARY KEY,
    Reason TEXT,
    ReportType ENUM('Spam','Fraud','Prohibited','Other') DEFAULT 'Other',
    ReportDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Pending','Reviewed','Rejected') DEFAULT 'Pending',
    UserID INT,
    AdvertisementID INT,
    FOREIGN KEY (UserID) REFERENCES User(UserID),
    FOREIGN KEY (AdvertisementID) REFERENCES Advertisement(AdvertisementID)
);

-- Bảng Notification
CREATE TABLE Notification (
    NotifyID INT AUTO_INCREMENT PRIMARY KEY,
    Message TEXT NOT NULL,
    Type VARCHAR(50),
    Status ENUM('Sent','Failed') DEFAULT 'Sent',
    isRead BOOLEAN DEFAULT FALSE,
    DateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    UserID INT,
    FOREIGN KEY (UserID) REFERENCES User(UserID)
);

-- Bảng Package (gói VIP)
CREATE TABLE Package (
    PackageID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Price DECIMAL(15,2) NOT NULL,
    Duration INT NOT NULL -- số ngày
);

-- Bảng Payment
CREATE TABLE Payment (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Amount DECIMAL(15,2),
    Method ENUM('Cash','Bank','EWallet') NOT NULL,
    Status ENUM('Pending','Success','Failed') DEFAULT 'Pending',
    UserID INT,
    PackageID INT,
    FOREIGN KEY (UserID) REFERENCES User(UserID),
    FOREIGN KEY (PackageID) REFERENCES Package(PackageID)
);

-- Bảng Chat (tin nhắn giữa users)
CREATE TABLE Chat (
    ChatID INT AUTO_INCREMENT PRIMARY KEY,
    Message TEXT NOT NULL,
    DateTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    SenderID INT,
    ReceiverID INT,
    FOREIGN KEY (SenderID) REFERENCES User(UserID),
    FOREIGN KEY (ReceiverID) REFERENCES User(UserID)
);
