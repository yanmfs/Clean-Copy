use std::fs;
use std::path::{Path, PathBuf};

const MAX_BYTES: u64 = 5 * 1024 * 1024;

#[derive(Debug, thiserror::Error)]
pub enum FileError {
    #[error("only .txt files are accepted")]
    NotText,
    #[error("file is larger than 5 MB")]
    TooLarge,
    #[error("could not read the file: {0}")]
    Io(#[from] std::io::Error),
    #[error("file is not valid UTF-8")]
    Encoding,
}

impl serde::Serialize for FileError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

pub fn read_text(path: &Path) -> Result<String, FileError> {
    let is_txt = path
        .extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| e.eq_ignore_ascii_case("txt"));
    if !is_txt {
        return Err(FileError::NotText);
    }
    if fs::metadata(path)?.len() > MAX_BYTES {
        return Err(FileError::TooLarge);
    }
    let bytes = fs::read(path)?;
    // Windows editors often save UTF-8 with a BOM.
    let bytes = bytes.strip_prefix(&[0xEF, 0xBB, 0xBF]).unwrap_or(&bytes);
    String::from_utf8(bytes.to_vec()).map_err(|_| FileError::Encoding)
}

#[tauri::command]
pub fn read_text_file(path: PathBuf) -> Result<String, FileError> {
    read_text(&path)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    fn temp_file(name: &str, content: &[u8]) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("cleancopy-test-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let path = dir.join(name);
        fs::File::create(&path).unwrap().write_all(content).unwrap();
        path
    }

    #[test]
    fn reads_utf8_and_strips_bom() {
        let path = temp_file("bom.txt", b"\xEF\xBB\xBFol\xC3\xA1");
        assert_eq!(read_text(&path).unwrap(), "olá");
    }

    #[test]
    fn rejects_other_extensions() {
        let path = temp_file("note.pdf", b"x");
        assert!(matches!(read_text(&path), Err(FileError::NotText)));
    }

    #[test]
    fn rejects_invalid_utf8() {
        let path = temp_file("latin1.txt", b"ol\xE1");
        assert!(matches!(read_text(&path), Err(FileError::Encoding)));
    }

    #[test]
    fn rejects_large_files() {
        let path = temp_file("big.txt", &vec![b'a'; (MAX_BYTES + 1) as usize]);
        assert!(matches!(read_text(&path), Err(FileError::TooLarge)));
    }
}
