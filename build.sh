#!/usr/bin/env bash

clang \
    --target=wasm32 \
    -nostdlib \
    -Oz -flto -Wl,--lto-O3 \
    -Wl,--no-entry \
    -Wl,--export-all \
    -Wl,--allow-undefined \
    -o lib.wasm \
    lib.c
