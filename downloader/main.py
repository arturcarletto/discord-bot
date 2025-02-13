import os
import discord
from discord.ext import commands
from keep_alive import keep_alive
import subprocess

active_downloads = set()

intents = discord.Intents.default()
intents.members = True

bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user.name}')

@bot.command()
async def download(ctx, platform: str, url: str, download_type: str = "mp4"):
    user = ctx.author

    if user.id in active_downloads:
        await ctx.send(f"{user.mention}, you already have a download in progress. Please wait.")
        return

    active_downloads.add(user.id)

    try:
        await user.send(f"**Download Started**\nPlatform: {platform}\nURL: {url}\nFormat: {download_type}")
    except discord.Forbidden:
        await ctx.send(f"{user.mention}, I couldn't send you a DM. Please check your privacy settings.")
        active_downloads.remove(user.id)
        return

    output_filename = "downloaded_media"

    if download_type.lower() == "mp3":
        command = [
            "yt-dlp",
            "--extract-audio",
            "--audio-format", "mp3",
            url,
            "-o", f"{output_filename}.%(ext)s"
        ]
        final_file = f"{output_filename}.mp3"
    else:
        # Default to mp4
        command = [
            "yt-dlp",
            url,
            "-f", "mp4",
            "-o", f"{output_filename}.%(ext)s"
        ]
        final_file = f"{output_filename}.mp4"

    try:
        subprocess.run(command, check=True)

        with open(final_file, "rb") as f:
            await user.send(file=discord.File(f, final_file))

        embed = discord.Embed(
            title="Download Complete",
            description=(
                f"**Platform:** {platform.capitalize()}\n"
                f"**URL:** {url}\n"
                f"**Requested by:** {user.mention}\n"
                f"**Format:** {download_type}"
            ),
            color=discord.Color.blue()
        )
        await ctx.send(embed=embed)

    except Exception as e:
        await ctx.send(f"Error during download: {e}")

    finally:
        if user.id in active_downloads:
            active_downloads.remove(user.id)

keep_alive()

bot.run(os.getenv('TOKEN'))
