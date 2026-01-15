#!/bin/bash

echo "🧹 Cleaning up VPS installation..."
echo "=========================================="

# Stop supervisor services
echo "⏹️  Stopping services..."
supervisorctl stop highlight-api 2>/dev/null || true
supervisorctl stop all 2>/dev/null || true

# Remove supervisor configs
echo "🗑️  Removing supervisor configs..."
rm -f /etc/supervisor/conf.d/highlight-api.conf
supervisorctl reread 2>/dev/null || true
supervisorctl update 2>/dev/null || true

# Remove conda environment
echo "🐍 Removing conda environment..."
if [ -d "/opt/conda" ]; then
    /opt/conda/bin/conda env remove -n sadtalker -y 2>/dev/null || true
fi

# Remove directories
echo "📁 Removing application directories..."
rm -rf /opt/venv
rm -rf /opt/conda
rm -rf /opt/app
rm -rf /opt/outputs
rm -rf /opt/models
rm -rf /opt/sadtalker

# Remove temp files
echo "🗑️  Cleaning temp files..."
rm -rf /tmp/video_*
rm -rf /tmp/audio_*
rm -rf /tmp/mascot_*
rm -rf /tmp/full_*.srt
rm -rf /tmp/selected_*.srt
rm -rf /tmp/srt_time_*.srt
rm -rf /tmp/miniconda.sh

# Remove logs
echo "📄 Removing logs..."
rm -f /var/log/highlight-api.out.log
rm -f /var/log/highlight-api.err.log

# Clear pip cache (optional)
echo "💾 Clearing pip cache..."
rm -rf ~/.cache/pip

# Clear conda cache (optional)
echo "💾 Clearing conda cache..."
rm -rf ~/.conda

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Run setup again: ~/setup.sh"
echo "  2. Upload main.py: scp -P PORT main.py root@VPS:/opt/app/main.py"
echo "  3. Start service: supervisorctl start highlight-api"
echo ""
