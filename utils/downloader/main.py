import os
import sys
import argparse
import yt_dlp
import instaloader
import tempfile

# Create (or get) a temp directory relative to this script
# so we store files in a dedicated ./temp folder.
temp_dir = os.path.join(os.path.dirname(__file__), "temp")
os.makedirs(temp_dir, exist_ok=True)

def download_youtube(url, media_type):
    """
    Downloads a YouTube video as MP4 or MP3 into `temp_dir`.
    Prints the final file path on success, or exits with error code 1 on failure.
    """
    try:
        # Configure yt_dlp to save files into our temp folder
        options = {
            'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
        }

        if media_type == "mp3":
            options.update({
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }]
            })
        else:  # default mp4
            options.update({'format': 'best'})

        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(url, download=True)
            # yt_dlp returns a dict of metadata about the downloaded video.
            # We'll ask it for the final filename:
            file_path = ydl.prepare_filename(info)

        # Print the exact file path so Node.js can grab it
        print(file_path)
        sys.exit(0)

    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)


def download_instagram(url):
    """
    Downloads an Instagram post (photo or video) into a subfolder `temp_dir/Instagram/`.
    Prints the path of that subfolder on success, or exits with error code 1 on failure.
    """
    try:
        # Initialize Instaloader
        loader = instaloader.Instaloader(download_videos=True, save_metadata=False)

        # Work inside our temp folder
        os.chdir(temp_dir)

        # Extract the shortcode from the URL
        shortcode = url.rstrip('/').split('/')[-1]

        # We'll store each Instagram post in `temp_dir/Instagram/<shortcode>`
        target_dir = os.path.join(temp_dir, 'Instagram')
        os.makedirs(target_dir, exist_ok=True)

        # Download the post (Instaloader will create a subfolder in `target_dir`)
        post = instaloader.Post.from_shortcode(loader.context, shortcode)
        loader.download_post(post, target=os.path.join(target_dir, shortcode))

        # Print the subfolder where files were saved
        print(os.path.join(target_dir, shortcode))
        sys.exit(0)

    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)


def download_tiktok(url):
    """
    Attempts to download TikTok videos/slideshows with yt-dlp into `temp_dir`.
    If a 'photo' link is detected, rewrites it to 'video' to force download.
    Prints the final file path or folder on success, or exits with code 1 on failure.
    """
    try:
        # If the user gave a 'photo' link, try rewriting it to 'video'
        if '/photo/' in url:
            url = url.replace('/photo/', '/video/')

        options = {
            'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
            'format': 'mp4',
        }
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(url, download=True)
            file_path = ydl.prepare_filename(info)

        print(file_path)
        sys.exit(0)

    except Exception as e:
        print(f"An error occurred while downloading TikTok media: {e}")
        sys.exit(1)


def main():
    """
    Parses CLI arguments and dispatches to the appropriate downloader function.
    Example usage:
      python main.py --platform youtube --url "https://..." --type mp3
      python main.py --platform instagram --url "https://..."
      python main.py --platform tiktok --url "https://..."
    """
    parser = argparse.ArgumentParser(description="Download media from YouTube, Instagram, or TikTok.")
    parser.add_argument("--platform", required=True, choices=["youtube", "instagram", "tiktok"],
                        help="Which platform to download from.")
    parser.add_argument("--url", required=True, help="The media URL to download.")
    parser.add_argument("--type", default="mp4",
                        help='For YouTube, specify "mp3" or "mp4" (default is mp4).')

    args = parser.parse_args()

    if args.platform == "youtube":
        download_youtube(args.url, args.type)
    elif args.platform == "instagram":
        download_instagram(args.url)
    elif args.platform == "tiktok":
        download_tiktok(args.url)
    else:
        print("Invalid platform specified.")
        sys.exit(1)


if __name__ == "__main__":
    main()
