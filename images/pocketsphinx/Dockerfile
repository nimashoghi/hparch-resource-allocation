FROM jonasfallmann/pocketsphinx:x86

RUN apt-get update; exit 0
RUN apt-get -o Acquire::Check-Valid-Until=false install --yes --no-install-recommends python3.7

WORKDIR /app
COPY ./detect.py ./detect.py

CMD python3.7 ./detect.py
