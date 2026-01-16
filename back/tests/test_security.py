from app.core.security import generate_verification_code


def test_generate_verification_code_returns_six_digits():
    code = generate_verification_code()

    assert len(code) == 6
    assert code.isdigit()


def test_generate_verification_code_is_not_constant():
    codes = {generate_verification_code() for _ in range(20)}

    assert len(codes) > 1
