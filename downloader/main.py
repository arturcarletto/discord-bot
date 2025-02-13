
import yt_dlp
import sys, os, argparse

def progress_hook(d):
    if d['status'] == 'downloading':
        downloaded = d.get('downloaded_bytes', 0)
        total = d.get('total_bytes', 0)
        if total > 0:
            percent = (downloaded / total) * 100
            print(f"PROGRESS {percent:.2f}")

def download_youtube(url):
    ydl_opts = {
        'progress_hooks': [progress_hook],
        'format': 'mp4',
        "fragment_retries": 10
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
    print(f"FILE {filename}")
    sys.exit(0)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    args = parser.parse_args()

    try:
        download_youtube(args.url)
    except Exception as e:
        print(f"ERROR {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
