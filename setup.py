from setuptools import setup

def install_requires():
    with open("requirements.txt") as f:
        lines = f.read().splitlines()
        install_requires = [line for line in lines]
        return install_requires

setup(
    name='mas_lib',
    version='0.0.1',
    description='Install packages for running MAS back-end',
    url='https://github.com/Meeting-Auto-Summarization/backend.git',
    author='Konkuk univ. grad-proj team 1',
    author_email='kkjsw17@naver.com',
    license='Geon-jun Ko, Ki-jun Kwon, Yeong-hwan Ju',
    packages=['mas_lib'],
    include_package_data=True,
    python_requires=">=3.6",
    zip_safe=False,
    install_requires=install_requires()
)