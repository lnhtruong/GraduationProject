import os

def print_tree(directory, prefix="", is_last=True, exclude_folders=None, is_root=True):
    """In ra cấu trúc thư mục dạng cây"""
    if exclude_folders is None:
        exclude_folders = []
    
    try:
        # Lấy tên thư mục
        dir_name = os.path.basename(directory)
        
        # In thư mục hiện tại
        if is_root:
            print(dir_name)
        else:
            connector = "└── " if is_last else "├── "
            print(prefix + connector + dir_name)
        
        # Cập nhật prefix cho các mục con
        if is_root:
            new_prefix = ""
        else:
            new_prefix = prefix + ("        " if is_last else "│       ")
        
        # Lấy danh sách các mục trong thư mục
        items = sorted(os.listdir(directory))
        
        # Lọc và phân loại thư mục và file
        dirs = [item for item in items if os.path.isdir(os.path.join(directory, item)) 
                and item not in exclude_folders]
        files = [item for item in items if os.path.isfile(os.path.join(directory, item))]
        
        # In các thư mục con trước
        for i, item in enumerate(dirs):
            item_path = os.path.join(directory, item)
            is_last_dir = (i == len(dirs) - 1) and len(files) == 0
            print_tree(item_path, new_prefix, is_last_dir, exclude_folders, False)
            if i < len(dirs) - 1 or len(files) > 0:
                print()  # Dòng trống giữa các thư mục
        
        # In các file
        for i, item in enumerate(files):
            connector = "└── " if i == len(files) - 1 else "├── "
            print(new_prefix + connector + item)
                
    except PermissionError:
        print(f"{prefix}[Permission Denied]")

# Sử dụng
if __name__ == "__main__":
    folder_path = "C:\\Users\\truon\\Documents\\_GraduationProject\\frontend\\src"
    
    # Danh sách các folder cần bỏ qua
    exclude_list = ["node_modules", ".git", "__pycache__", "dist", "build"]
    
    if os.path.exists(folder_path):
        print_tree(folder_path, exclude_folders=exclude_list)
    else:
        print("Đường dẫn không tồn tại!")