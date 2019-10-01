# A simple script to backup the current database and store it online, useful for "syncing"

while true
  do
  echo "Backing up local copy"
  mongodump --out ~/dump/backup

  echo "Copying to remote"
  mongorestore -h <hostname> -d <database_name> -u <username> -p <password> --drop ~/dump/backup/contest_scoreboard/

  echo "Sleeping for 5 seconds"
  sleep 5
done
