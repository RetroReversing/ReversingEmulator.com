#pragma once

#include "matoya.h"

typedef struct JUN_Settings JUN_Settings;

struct JUN_Settings
{
    MTY_JSON *json;

    char *language;
    MTY_Hash *configurations;
};

JUN_Settings *JUN_SettingsCreate(const char *json);
void JUN_SettingsDestroy(JUN_Settings **settings);
