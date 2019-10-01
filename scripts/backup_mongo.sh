# A simple script to backup the current database by creating a timestamp and backing it up to that directory
backup_dir=$(date +%Y_%m_%d_%H_%M_%S)
mongodump --out ./backup/${backup_dir}-data
