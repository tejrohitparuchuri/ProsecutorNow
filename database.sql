    CREATE TABLE users (
        userid VARCHAR2(50) PRIMARY KEY,
        aadhar_number VARCHAR2(12) UNIQUE NOT NULL,
        password VARCHAR2(255) NOT NULL
    );

    CREATE TABLE cases (
        case_id VARCHAR2(50) PRIMARY KEY,
        progress_id VARCHAR2(50) UNIQUE NOT NULL,
        status VARCHAR2(50) NOT NULL CHECK (status IN ('Hearing', 'Beginning', 'Closed')),
        category VARCHAR2(50),
        victim_name VARCHAR2(100),
        phone_number VARCHAR2(15),
        relationship VARCHAR2(50),
        description CLOB,
        owner_userid VARCHAR2(50),
        FOREIGN KEY (owner_userid) REFERENCES users(userid)
    );

    BEGIN
        FOR i IN 1..15 LOOP
            INSERT INTO users (userid, aadhar_number, password) 
            VALUES ('user' || i, '1234567890' || LPAD(i, 2, '0'), '123');
        END LOOP;
    END;
    /

    INSERT INTO cases (case_id, progress_id, status, description, owner_userid) 
    VALUES ('IND-1001', 'PG-001X', 'Beginning', 'Initial filing of public interest litigation against alleged illegal construction. Waiting for the first bench assignation.', 'user1');

    INSERT INTO cases (case_id, progress_id, status, description, owner_userid) 
    VALUES ('IND-1002', 'PG-002Y', 'Hearing', 'Second hearing regarding the civil contract dispute. Both parties have submitted their evidence and final arguments are underway.', 'user2');

    INSERT INTO cases (case_id, progress_id, status, description, owner_userid) 
    VALUES ('IND-1003', 'PG-003Z', 'Closed', 'Case dismissed due to lack of evidence.', 'user3');

    COMMIT;
