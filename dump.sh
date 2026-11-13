gcloud storage cp --recursive gs://erns-songs .
zip -r songs_$1.zip erns-songs
rm -rf erns-songs
