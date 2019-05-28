set -eux

pipenv shell
python scrape_db.py "$@"

