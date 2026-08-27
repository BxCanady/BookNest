use bcrypt::{DEFAULT_COST, hash, verify};

pub fn hash_password(password: &str) -> String {
    let _ = password;
    todo!("implement password hashing")
}

pub fn verify_password(password: &str, password_hash: &str) -> bool {
    let _ = (password, password_hash);
    todo!("implement password verification")
}

#[cfg(test)]
mod tests {
    use super::{hash_password, verify_password};

    #[test]
    fn hashes_and_verifies_passwords() {
        let hashed = hash_password("secret123");
        assert!(hashed.starts_with("$2"));
        assert!(verify_password("secret123", &hashed));
        assert!(!verify_password("wrong", &hashed));
    }
}
