#!/usr/bin/env python3

import json
import os
import os.path
import tempfile
import time
import subprocess
import urllib.parse
import urllib.request


commands = set(["up", "down", "left", "right"])

start_timestamp = None
predictions = []
num_correct = 0
skipped = 0

def get_suffix(path: str):
    return os.path.splitext(urllib.parse.urlparse(path).path)[1]


def wait_for_start(start_file="/start"):
    print("Waiting for start signal...")
    while True:
        if os.path.exists(start_file):
            try:
                with open(start_file, "r") as f:
                    status = int(str(f.read()).strip())
                    if status == 1:
                        print("Started!")
                        global start_timestamp
                        start_timestamp = time.time()
                        break
            except:
                pass

        time.sleep(0.1)


def run_command(command_path: str, model_name="8050", model_path="/model/"):
    process = subprocess.run(
        [
            "pocketsphinx_continuous",
            "-infile",
            command_path,
            "-dict",
            os.path.join(model_path, "{}.dic".format(model_name)),
            "-lm",
            os.path.join(model_path, "{}.lm".format(model_name)),
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        universal_newlines=True,
    )
    command = str(process.stdout).strip().lower()
    return command if command in commands else None


def log_prediction(audio_path, prediction, ground_truth, start, end):
    global num_correct, predictions
    predictions.append(
        dict(
            audio=audio_path,
            prediction=prediction,
            groundTruth=ground_truth,
            start=start,
            end=end,
            duration=end - start,
        )
    )

    if prediction == ground_truth:
        num_correct += 1


def dump_predictions(output_file="/output.json"):
    global num_correct, predictions, start_timestamp

    num_events = len(predictions)
    accuracy = num_correct / num_events
    print("Accuracy is " + str(accuracy))
    print(
        "Accuracy of the shots taken is "
        + str(
            num_correct
            / len(
                [
                    prediction
                    for prediction in predictions
                    if prediction["prediction"] != None
                ]
            )
        )
    )

    with open(output_file, "w") as f:
        json.dump(
            dict(
                startTimestamp=start_timestamp,
                numEvents=num_events,
                numCorrect=num_correct,
                accuracy=accuracy,
                predictions=predictions,
            ),
            f,
            indent=4,
        )


def get_current_relative_time():
    global start_timestamp

    return time.time() - start_timestamp


def process_timeline(path="/timeline.json", time_delta=0.01, should_wait=True, should_skip=True):
    with open(path, "r") as f:
        data = json.load(f)

    timeline = data["timeline"]
    for event in timeline:
        current_relative_time = get_current_relative_time()

        if current_relative_time > event["timestamp"] + 0.25:
            global skipped

            print(f"Skipped timestamp {timestamp}!")
            skipped += 1

            continue

        if should_wait:
            # wait for the event to actually happen within the timeline
            while current_relative_time < event["timestamp"]:
                time.sleep(time_delta)

        # dispatch the event
        temp = tempfile.mktemp(
            suffix=get_suffix(event["location"]), prefix="voice-detection-"
        )
        print("Downloading file to {}".format(temp))
        urllib.request.urlretrieve(event["location"], temp)

        try:
            yield temp, event["command"]
        finally:
            if os.path.exists(temp) and os.path.isfile(temp):
                os.remove(temp)
                print("Removing {}".format(temp))


def main():
    global skipped
    wait_for_start()

    try:
        for location, ground_truth in process_timeline():
            print(location, ground_truth)
            start = time.time()
            prediction = run_command(location)
            end = time.time()

            log_prediction(location, prediction, ground_truth, start, end)

            if not prediction:
                print("No command detected!")
            else:
                print("Command detected: " + str(prediction))
    finally:
        dump_predictions("/out/output.json")
        print(f"Total number of skipped audio: {skipped}")


if __name__ == "__main__":
    main()
