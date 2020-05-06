CREATE TABLE IF NOT EXISTS steno_test_table (
    test_id serial NOT NULL PRIMARY KEY,
    test_name VARCHAR NOT NULL,
    test_version BIGINT NOT NULL,
    test_create_dt TIMESTAMP NOT NULL
);