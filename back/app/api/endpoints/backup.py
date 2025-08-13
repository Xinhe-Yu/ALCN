import os
import subprocess
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from app.core.config import settings
from app.api.deps import get_current_admin_user
from app.models.models import User

router = APIRouter()

BACKUP_DIR = Path("/app/backups")
BACKUP_DIR.mkdir(exist_ok=True)


@router.post("/create")
async def create_backup(current_admin: User = Depends(get_current_admin_user)):
    """Create a database backup (admin only)"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"alcn_backup_{timestamp}.sql"
        backup_path = BACKUP_DIR / backup_filename
        
        # Extract database connection details from DATABASE_URL
        db_url = settings.DATABASE_URL
        if db_url.startswith("postgresql://"):
            # Parse DATABASE_URL: postgresql://user:password@host:port/database
            url_parts = db_url.replace("postgresql://", "").split("/")
            db_name = url_parts[1]
            auth_host = url_parts[0].split("@")
            host_port = auth_host[1].split(":")
            host = host_port[0]
            port = host_port[1] if len(host_port) > 1 else "5432"
            user_pass = auth_host[0].split(":")
            user = user_pass[0]
            password = user_pass[1]
        else:
            # Fallback to environment variables
            db_name = os.getenv("POSTGRES_DB", "alcn")
            host = os.getenv("POSTGRES_HOST", "db")
            port = os.getenv("POSTGRES_PORT", "5432")
            user = os.getenv("POSTGRES_USER", "postgres")
            password = os.getenv("POSTGRES_PASSWORD", "")
        
        # Create pg_dump command
        env = os.environ.copy()
        env["PGPASSWORD"] = password
        
        cmd = [
            "pg_dump",
            f"-h{host}",
            f"-p{port}",
            f"-U{user}",
            f"-d{db_name}",
            "--no-owner",
            "--no-privileges",
            "-f", str(backup_path)
        ]
        
        # Execute backup
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Backup failed: {result.stderr}"
            )
        
        # Get file size
        file_size = backup_path.stat().st_size
        
        return {
            "message": "Backup created successfully",
            "filename": backup_filename,
            "size_bytes": file_size,
            "created_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")


@router.get("/list")
async def list_backups(current_admin: User = Depends(get_current_admin_user)):
    """List all available backups (admin only)"""
    try:
        backups = []
        for backup_file in BACKUP_DIR.glob("*.sql"):
            stat = backup_file.stat()
            backups.append({
                "filename": backup_file.name,
                "size_bytes": stat.st_size,
                "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
        
        # Sort by creation time (newest first)
        backups.sort(key=lambda x: x["created_at"], reverse=True)
        
        return {"backups": backups}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list backups: {str(e)}")


@router.get("/download/{filename}")
async def download_backup(filename: str, current_admin: User = Depends(get_current_admin_user)):
    """Download a specific backup file (admin only)"""
    backup_path = BACKUP_DIR / filename
    
    if not backup_path.exists() or not backup_path.suffix == ".sql":
        raise HTTPException(status_code=404, detail="Backup file not found")
    
    return FileResponse(
        path=str(backup_path),
        filename=filename,
        media_type="application/sql"
    )


@router.delete("/delete/{filename}")
async def delete_backup(filename: str, current_admin: User = Depends(get_current_admin_user)):
    """Delete a specific backup file (admin only)"""
    backup_path = BACKUP_DIR / filename
    
    if not backup_path.exists() or not backup_path.suffix == ".sql":
        raise HTTPException(status_code=404, detail="Backup file not found")
    
    try:
        backup_path.unlink()
        return {"message": f"Backup {filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete backup: {str(e)}")