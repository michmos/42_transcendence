#!/bin/sh

# Make sure the CDN avatars directory exists
mkdir -p /data/cdn/avatars

# Copy the base avatar to the CDN avatars directory
cp /tmp/base_avatar.png /data/cdn/avatars