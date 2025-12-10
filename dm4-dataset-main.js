// DM4 MAIN DATASET (PhaseG EditorNotes)
window.DM4_DATASETS = window.DM4_DATASETS || {};
window.DM4_DATASETS.main = {
  "coordinate_systems": {
    "DustigSector_pixels": {
      "origin": "top_left",
      "type": "pixel"
    },
    "EA1_pixels": {
      "origin": "top_left",
      "type": "pixel"
    },
    "Grumani_pixels": {
      "origin": "top_left",
      "type": "pixel"
    },
    "MapSnip_pixels": {
      "height": 478,
      "origin": "top_left",
      "type": "pixel",
      "width": 547
    },
    "OcclusionZone_pixels": {
      "origin": "top_left",
      "type": "pixel"
    },
    "SenexEA_pixels": {
      "origin": "top_left",
      "type": "pixel"
    },
    "SenexJuvex_pixels": {
      "origin": "top_left",
      "type": "pixel"
    },
    "WesternReaches_pixels": {
      "origin": "top_left",
      "type": "pixel"
    },
    "system_pixels": {
      "origin": "top_left",
      "type": "pixel"
    }
  },
  "coordinate_transforms": {
    "DustigSector_pixels_to_system_pixels": {
      "anchor_ref": "DustigSector_to_system_pixels",
      "notes": "Affine transform from Dustig Sector reference map using Eiattu/Indupar/Tshindral/Vondarc/Haruun Kal/Chryaa/Naboo anchors (subset used per dataset).",
      "source": "DustigSector_pixels",
      "target": "system_pixels",
      "type": "affine"
    },
    "EA1_pixels_to_system_pixels": {
      "anchor_ref": "EssentialAtlas1_to_system_pixels",
      "notes": "Affine transform parameters can be derived from the six anchor pairs.",
      "source": "EA1_pixels",
      "target": "system_pixels",
      "type": "affine"
    },
    "Grumani_pixels_to_system_pixels": {
      "anchor_ref": "Grumani_to_system_pixels",
      "notes": "Affine transform from Grumani reference map into system_pixels, derived from 5 anchors.",
      "source": "Grumani_pixels",
      "target": "system_pixels",
      "type": "affine"
    },
    "MapSnip_pixels_to_system_pixels": {
      "anchor_ref": "MapSnip_to_system_pixels",
      "notes": "Affine transform from 547x478 MapSnip.png into system_pixels, derived from 7 anchors.",
      "source": "MapSnip_pixels",
      "target": "system_pixels",
      "type": "affine"
    },
    "OcclusionZone_pixels_to_system_pixels": {
      "anchor_ref": "OcclusionZone_to_system_pixels",
      "notes": "Affine transform from OcclusionZone reference map into system_pixels, derived from OcclusionZone_to_system_pixels anchors.",
      "source": "OcclusionZone_pixels",
      "target": "system_pixels",
      "type": "affine"
    },
    "SenexEA_pixels_to_system_pixels": {
      "anchor_ref": "SenexEA_to_system_pixels",
      "notes": "Affine transform from SenexEA map into system_pixels, derived from 8 anchors.",
      "source": "SenexEA_pixels",
      "target": "system_pixels",
      "type": "affine"
    },
    "SenexJuvex_pixels_to_system_pixels": {
      "anchor_ref": "SenexJuvex_to_system_pixels",
      "notes": "Affine transform from SenexJuvex map into system_pixels, derived from 4 anchors.",
      "source": "SenexJuvex_pixels",
      "target": "system_pixels",
      "type": "affine"
    },
    "WesternReaches_pixels_to_system_pixels": {
      "anchor_ref": "WesternReaches_to_system_pixels",
      "notes": "Affine transform from Western Reaches map into system_pixels, derived from 6 anchors.",
      "source": "WesternReaches_pixels",
      "target": "system_pixels",
      "type": "affine"
    }
  },
  "dataset_metadata": {
    "compatible_render_process_min_version": "2.4",
    "description": "Primary Dreadmarch map dataset with Essential Atlas 1 anchors and Darkknell rename. Verdanth moved via EA1 coordinates and integrated into Darkknell–New Cov Hyperlane. Verdanth EA1 coordinate corrected to (209,102). Added Seswenna/Seatos/Denab label prefs, Denab on Rimma, Lipsec Run, and new systems Dorlo, Shadda-Bi-Boran, Eiattu, Karfeddion. Corrected Karfeddion, added Tiferep, added Svivren. Added MapSnip (547x478) affine anchors and transform to system_pixels. Transformed Eiattu, Karfeddion, Tiferep from MapSnip. Added WesternReaches reference map with affine transform into system_pixels. Added Ogem via WesternReaches transform. Added SenexEA reference map with affine transform into system_pixels. Added Velga and Indupar via SenexEA transform. Added SenexJuvex reference map and systems Juvex, Neelanon, Senex via 4-anchor transform. Added DustigSector map, Juvex label fix, Chryya, Vogel, Tshindral. Added Umgul and Dargul via DustigSector. Added Naalol via SenexEA transform. Pruned Arbra routes, removed Sullust–Arbra and Eriadu–Arbra hyperlanes, rerouted Sanrafsix Corridor, added Arbra–Crait minor route. Arbra moved via EA1 transform to source coords (216,128). Forked to 3.22-Bon to place additional Bon'nyuw-Luq systems (Destreg, Beetle Nebula, Nellac Kram, Luxiar, Gonda, Speco, Zairona, Yethra) and add label hints. Added Bonnyuw sector polygon boundary (experimental) as sector_boundaries.Bonnyuw. Added galactic_grid metadata and system_grid assignments; adjusted Cerroban to N-18 in house grid. Recomputed system_grid for all systems to match current positions and house grid. Adjusted Sanrafsix Corridor south endpoint to align with Rimma South latitude for row trimming. Adjusted galactic_grid cell_size to 1024x1024 without changing any system's cell assignment. Updated grid semantics so letters index columns and numbers index rows; recomputed system_grid accordingly. Translated coordinates so canvas spans columns L–O and rows 16–19 exactly (4096x4096 viewfield). Updated Sharllissia–Triton Corridor hyperlane layout to Triton–Xagobah–Kabal–Nellac Kram–Sharllissia per Wookieepedia. Renamed Sharllissia–Triton Corridor hyperlane key to Sharlissian Trade Corridor. Added per-system 'systems' index consolidating coordinates, grid, sector, label, and route membership. | Rescaled to 1500x1500 grid cells.",
    "name": "MainDataset_v5.1",
    "schema_version": "3.4",
    "version": "5.1"
  },
  "dataset_template": {
    "coordinate_systems": {
      "MapSnip_pixels": {
        "origin": "top_left",
        "type": "pixel"
      },
      "system_pixels": {
        "origin": "top_left",
        "type": "pixel"
      }
    },
    "coordinate_transforms": {},
    "creation_checklist": "Dreadmarch New Region Dataset Checklist (3.x Schema)\n\n1. Copy dataset_template into a new file.\n2. Fill system_pixels.\n3. Add sectors (optional).\n4. Add hyperlanes: minor_routes + named routes.\n5. Add endpoint_pixels if using continuations/junctions.\n6. Add endpoint_metadata with endpoint_type.\n7. Add route_metadata for each named route.\n8. Add label_metadata (optional).\n9. Set dataset_metadata version/name/description.\n10. Validate with RenderProcess_2_3.py --validate.\n11. Render normally.",
    "dataset_metadata": {
      "compatible_render_process_min_version": "2.2",
      "description": "Template dataset for creating new Dreadmarch map regions. Fill in systems, routes, endpoints, sectors using this structure.",
      "name": "Dreadmarch Dataset Template",
      "notes": "Start by defining system_pixels for your region, then hyperlanes and route_metadata. Endpoint pixels/metadata are optional unless you have continuations or junction helpers.",
      "version": "Template-1.0"
    },
    "endpoint_metadata": {},
    "endpoint_pixels": {},
    "hyperlanes": {
      "minor_routes": []
    },
    "label_metadata": {},
    "reference_anchors": {},
    "reference_sources": {
      "MapSnip": {
        "coordinate_system": "MapSnip_pixels",
        "description": "Primary base map used for system_pixels.",
        "file_hint": "/mnt/data/MapSnip.png",
        "id": "MapSnip",
        "type": "image"
      }
    },
    "route_metadata": {},
    "sectors": {},
    "system_pixels": {}
  },
  "endpoint_metadata": {
    "AdoSpine_Terminus": {
      "note": "Ado Spine in-map terminus at Karfeddion junction; do not project to edge",
      "role": "in_map_terminus",
      "route_id": "Ado Spine"
    },
    "Gerrenthum_Ext": {
      "continuation_label": "Gerrenthum–Eriadu Hyperlane",
      "edge": "west",
      "endpoint_type": "continuation",
      "margin": 75,
      "outward_vector": [
        -1,
        0
      ],
      "role": "synthetic_edge",
      "route_class": "medium",
      "route_id": "Nothoiin Corridor",
      "route_name": "Gerrenthum–Eriadu Hyperlane"
    },
    "Hydian_North": {
      "continuation_label": "Hydian Way",
      "edge": "north",
      "endpoint_type": "continuation",
      "margin": 75,
      "outward_vector": [
        0,
        -1
      ],
      "role": "synthetic_edge",
      "route_class": "major",
      "route_id": "Hydian Way",
      "route_name": "Hydian Way"
    },
    "Hydian_South": {
      "continuation_label": "Hydian Way",
      "edge": "south",
      "endpoint_type": "continuation",
      "margin": 75,
      "outward_vector": [
        0,
        1
      ],
      "role": "synthetic_edge",
      "route_class": "major",
      "route_id": "Hydian Way",
      "route_name": "Hydian Way"
    },
    "KarfeddionEriadu_WP1": {
      "endpoint_type": "junction",
      "route": "Karfeddion–Eriadu Hyperlane"
    },
    "KarfeddionEriadu_WP2": {
      "endpoint_type": "junction",
      "route": "Karfeddion–Eriadu Hyperlane"
    },
    "KarfeddionEriadu_WP3": {
      "endpoint_type": "junction",
      "route": "Karfeddion–Eriadu Hyperlane"
    },
    "Lipsec_Ext": {
      "continuation_label": "Lipsec Run",
      "edge": "west",
      "endpoint_type": "continuation",
      "margin": 75,
      "outward_vector": [
        -1,
        0
      ],
      "role": "synthetic_edge",
      "route_class": "medium",
      "route_id": "Lipsec Run",
      "route_name": "Lipsec Run"
    },
    "NewCov_Ext": {
      "continuation_label": "Duros Space Run",
      "edge": "east",
      "endpoint_type": "continuation",
      "margin": 75,
      "outward_vector": [
        1,
        0
      ],
      "role": "synthetic_edge",
      "route_class": "medium",
      "route_id": "Duros Space Run",
      "route_name": "Duros Space Run"
    },
    "Pipada_Clakdor_Hydian_X1": {
      "endpoint_type": "junction"
    },
    "Rilias_Pamarthe_Rimma_X1": {
      "endpoint_type": "junction"
    },
    "Rimma_North": {
      "continuation_label": "Rimma Trade Route",
      "edge": "north",
      "endpoint_type": "continuation",
      "margin": 75,
      "outward_vector": [
        0,
        -1
      ],
      "role": "synthetic_edge",
      "route_class": "major",
      "route_id": "Rimma Trade Route",
      "route_name": "Rimma Trade Route"
    },
    "Rimma_South": {
      "continuation_label": "Rimma Trade Route",
      "edge": "south",
      "endpoint_type": "continuation",
      "margin": 75,
      "outward_vector": [
        0,
        1
      ],
      "role": "synthetic_edge",
      "route_class": "major",
      "route_id": "Rimma Trade Route",
      "route_name": "Rimma Trade Route"
    },
    "SanrafsixCorr_Ext": {
      "continuation_label": "Sanrafsix Corridor",
      "edge": "south",
      "endpoint_type": "continuation",
      "margin": 75,
      "outward_vector": [
        0,
        1
      ],
      "role": "synthetic_edge",
      "route_class": "medium",
      "route_id": "Sanrafsix Corridor",
      "route_name": "Sanrafsix Corridor"
    }
  },
  "endpoint_pixels": {
    "AdoSpine_Terminus": [
      1167,
      2652
    ],
    "Gerrenthum_Ext": [
      75,
      3665.01
    ],
    "Hydian_North": [
      3312.37,
      75
    ],
    "Hydian_South": [
      449.5,
      5925
    ],
    "KarfeddionEriadu_WP1": [
      1167,
      2652
    ],
    "KarfeddionEriadu_WP2": [
      876,
      2803
    ],
    "KarfeddionEriadu_WP3": [
      741,
      2850
    ],
    "Lipsec_Ext": [
      75,
      5011.56
    ],
    "NewCov_Ext": [
      5925,
      1548.67
    ],
    "Pipada_Clakdor_Hydian_X1": [
      1979.00390625,
      3896.484375
    ],
    "Rilias_Pamarthe_Rimma_X1": [
      2333.49609375,
      3900.87890625
    ],
    "Rimma_North": [
      1845.76,
      75
    ],
    "Rimma_South": [
      2330.64,
      5925
    ],
    "SanrafsixCorr_Ext": [
      4171.71,
      5925
    ]
  },
  "galactic_grid": {
    "cell_size": [
      1500,
      1500
    ],
    "col_origin": 17,
    "reference_cell": {
      "bounds": {
        "x_max": 4500,
        "x_min": 3000,
        "y_max": 3000,
        "y_min": 1500
      },
      "col": 17,
      "row": "N"
    },
    "row_origin": "N"
  },
  "hyperlanes": {
    "Ado Spine": [
      [
        "Medth",
        "Indupar"
      ],
      [
        "Indupar",
        "Eiattu"
      ],
      [
        "Eiattu",
        "AdoSpine_Terminus"
      ]
    ],
    "Duros Space Run": [
      [
        "Darkknell",
        "Jutrand"
      ],
      [
        "Jutrand",
        "Baraan-Fa"
      ],
      [
        "Baraan-Fa",
        "Heptooine"
      ],
      [
        "Heptooine",
        "Sanrafsix"
      ],
      [
        "Sanrafsix",
        "Kessar"
      ],
      [
        "Kessar",
        "Verdanth"
      ],
      [
        "Verdanth",
        "Cyclor"
      ],
      [
        "Cyclor",
        "Enarc"
      ],
      [
        "Enarc",
        "NewCov_Ext"
      ]
    ],
    "Dustig Trace": [
      [
        "Kath",
        "Malastare"
      ],
      [
        "Malastare",
        "Demos"
      ]
    ],
    "Enarc Run": [
      [
        "Enarc",
        "Naboo"
      ],
      [
        "Naboo",
        "Alassa Major"
      ],
      [
        "Alassa Major",
        "Kalinda"
      ],
      [
        "Kalinda",
        "Nigel"
      ],
      [
        "Nigel",
        "Roldalna"
      ],
      [
        "Roldalna",
        "Ropagi"
      ],
      [
        "Ropagi",
        "Pax"
      ],
      [
        "Pax",
        "Opiteihr"
      ],
      [
        "Opiteihr",
        "Vogel"
      ],
      [
        "Vogel",
        "Vondarc"
      ]
    ],
    "Hydian Way": [
      [
        "Hydian_North",
        "Pax"
      ],
      [
        "Pax",
        "ZeHeth"
      ],
      [
        "ZeHeth",
        "Malastare"
      ],
      [
        "Malastare",
        "Chryya"
      ],
      [
        "Chryya",
        "Aquilaris Minor"
      ],
      [
        "Aquilaris Minor",
        "Kamasto"
      ],
      [
        "Kamasto",
        "Darkknell"
      ],
      [
        "Darkknell",
        "Tanta Aurek"
      ],
      [
        "Tanta Aurek",
        "Cmaoli Di"
      ],
      [
        "Cmaoli Di",
        "Orish"
      ],
      [
        "Orish",
        "Seswenna"
      ],
      [
        "Seswenna",
        "Averam"
      ],
      [
        "Averam",
        "Shumavar"
      ],
      [
        "Shumavar",
        "Atravis"
      ],
      [
        "Atravis",
        "Hydian_South"
      ]
    ],
    "Karfeddion–Eriadu Hyperlane": [
      [
        "Eriadu",
        "Gad"
      ],
      [
        "Gad",
        "KarfeddionEriadu_WP1"
      ],
      [
        "KarfeddionEriadu_WP1",
        "KarfeddionEriadu_WP2"
      ],
      [
        "KarfeddionEriadu_WP2",
        "KarfeddionEriadu_WP3"
      ],
      [
        "KarfeddionEriadu_WP3",
        "Senex"
      ],
      [
        "Senex",
        "Neelanon"
      ],
      [
        "Neelanon",
        "Karfeddion"
      ]
    ],
    "Lipsec Run": [
      [
        "Eriadu",
        "Dorvalla"
      ],
      [
        "Dorvalla",
        "Kelrodo-Ai"
      ],
      [
        "Kelrodo-Ai",
        "Lipsec_Ext"
      ]
    ],
    "Nothoiin Corridor": [
      [
        "Eriadu",
        "Dolla"
      ],
      [
        "Dolla",
        "Gerrenthum_Ext"
      ]
    ],
    "Rimma Trade Route": [
      [
        "Sluis Van",
        "Denab and Seatos"
      ],
      [
        "Rimma_North",
        "Alakatha"
      ],
      [
        "Alakatha",
        "Lanthe"
      ],
      [
        "Lanthe",
        "Vondarc"
      ],
      [
        "Vondarc",
        "Tshindral"
      ],
      [
        "Tshindral",
        "Najan-Rovi"
      ],
      [
        "Najan-Rovi",
        "Sullust"
      ],
      [
        "Sullust",
        "Parwa"
      ],
      [
        "Parwa",
        "Eriadu"
      ],
      [
        "Eriadu",
        "Clak'dor"
      ],
      [
        "Clak'dor",
        "Triton"
      ],
      [
        "Triton",
        "Praesitlyn"
      ],
      [
        "Praesitlyn",
        "Sluis Van"
      ],
      [
        "Denab and Seatos",
        "Rimma_South"
      ]
    ],
    "Sanrafsix Corridor": [
      [
        "Sanrafsix",
        "Syned"
      ],
      [
        "Syned",
        "Omwat"
      ],
      [
        "Omwat",
        "Blarrum"
      ],
      [
        "Blarrum",
        "Daxam"
      ],
      [
        "Daxam",
        "Kabal"
      ],
      [
        "Kabal",
        "Rior"
      ],
      [
        "Rior",
        "Sag Kemper"
      ],
      [
        "Sag Kemper",
        "Sevarcos"
      ],
      [
        "Sevarcos",
        "Kirdo"
      ],
      [
        "Kirdo",
        "Valo"
      ],
      [
        "Valo",
        "SanrafsixCorr_Ext"
      ]
    ],
    "Sharlissia Trade Corridor": [
      [
        "Triton",
        "Xagobah"
      ],
      [
        "Xagobah",
        "Kabal"
      ],
      [
        "Kabal",
        "Nellac Kram"
      ],
      [
        "Nellac Kram",
        "Sharlissia"
      ]
    ],
    "Var-Shaa Spur": [
      [
        "Var-Shaa",
        "Chryya"
      ]
    ],
    "minor_routes": [
      [
        "Belsavis",
        "Bortras"
      ],
      [
        "Bortras",
        "Eriadu"
      ],
      [
        "Bortras",
        "Gad"
      ],
      [
        "Callos",
        "Eriadu"
      ],
      [
        "Callos",
        "Gad"
      ],
      [
        "Callos",
        "Sullust"
      ],
      [
        "Clak'dor",
        "H'Nemthe"
      ],
      [
        "Daxam",
        "Rior"
      ],
      [
        "H'Nemthe",
        "Kerest"
      ],
      [
        "Kabal",
        "Pamarthe"
      ],
      [
        "Kerest",
        "Vixoseph"
      ],
      [
        "Kirdo",
        "Rior"
      ],
      [
        "Kirdo",
        "Stygmarn"
      ],
      [
        "Orish",
        "Sullust"
      ],
      [
        "Pamarthe",
        "Sevarcos"
      ],
      [
        "Stygmarn",
        "Valo"
      ],
      [
        "Triton",
        "Xagobah"
      ],
      [
        "Orto",
        "Sluis Van"
      ],
      [
        "Ord Grovner",
        "Bartokan"
      ],
      [
        "Bartokan",
        "Kirdo"
      ],
      [
        "Gad",
        "Tibrin"
      ],
      [
        "Pipada",
        "Eriadu"
      ],
      [
        "Pipada",
        "Pipada_Clakdor_Hydian_X1"
      ],
      [
        "Rilias",
        "Rilias_Pamarthe_Rimma_X1"
      ],
      [
        "Najan-Rovi",
        "Darkknell"
      ],
      [
        "Denab and Seatos",
        "Vixoseph"
      ],
      [
        "Loposi",
        "Tshindral"
      ],
      [
        "Arbra",
        "Crait"
      ],
      [
        "Haruun Kal",
        "Loposi"
      ],
      [
        "Felne",
        "Omwat"
      ],
      [
        "Yethra",
        "Syned"
      ],
      [
        "Arbra",
        "Yethra"
      ],
      [
        "Uvena",
        "Eriadu"
      ],
      [
        "Uvena",
        "Parwa"
      ],
      [
        "Kessar",
        "Crait"
      ],
      [
        "Haruun Kal",
        "Var-Shaa"
      ],
      [
        "Destreg",
        "Gonda"
      ],
      [
        "Gonda",
        "Luxiar"
      ],
      [
        "Luxiar",
        "Zairona"
      ],
      [
        "Zairona",
        "Speco"
      ],
      [
        "Speco",
        "Yethra"
      ],
      [
        "Arbra",
        "Luxiar"
      ],
      [
        "Arbra",
        "Verdanth"
      ],
      [
        "Cerroban",
        "Nellac Kram"
      ],
      [
        "Felne",
        "Yethra"
      ],
      [
        "Oanne",
        "Sharlissia"
      ],
      [
        "Oetchi",
        "Crait"
      ],
      [
        "Vogel",
        "Vondarc"
      ],
      [
        "Umgul and Dargul",
        "Malastare"
      ],
      [
        "Rilias",
        "Averam"
      ],
      [
        "Rilias",
        "Clak'dor"
      ]
    ]
  },
  "label_metadata": {
    "Callos": {
      "preferred_dir": "above"
    },
    "Daxam": {
      "preferred_dir": "left"
    },
    "Denab and Seatos": {
      "preferred_dir": "below"
    },
    "Destreg": {
      "preferred_dir": "left"
    },
    "Gonda": {
      "preferred_dir": "below"
    },
    "Juvex": {
      "preferred_dir": "left"
    },
    "Karfeddion": {
      "preferred_dir": "below"
    },
    "Luxiar": {
      "preferred_dir": "above"
    },
    "Nellac Kram": {
      "preferred_dir": "left"
    },
    "Omwat": {
      "preferred_dir": "left"
    },
    "Senex": {
      "preferred_dir": "right"
    },
    "Seswenna": {
      "preferred_dir": "right"
    },
    "Speco": {
      "preferred_dir": "right"
    },
    "Velga": {
      "preferred_dir": "left"
    },
    "Verdanth": {
      "preferred_dir": "right"
    },
    "Yethra": {
      "preferred_dir": "right"
    },
    "Zairona": {
      "preferred_dir": "above"
    }
  },
  "reference_anchors": {
    "DustigSector_to_system_pixels": {
      "anchors": {
        "Eiattu": {
          "source": [
            115,
            215
          ],
          "target": [
            1337.40234375,
            2308.59375
          ]
        },
        "Haruun Kal": {
          "source": [
            215,
            163
          ],
          "target": [
            2623.53515625,
            1727.05078125
          ]
        },
        "Indupar": {
          "source": [
            173,
            188
          ],
          "target": [
            2147.4609375,
            1946.77734375
          ]
        },
        "Naboo": {
          "source": [
            386,
            163
          ],
          "target": [
            5021.484375,
            1608.3984375
          ]
        },
        "Tshindral": {
          "source": [
            185,
            205
          ],
          "target": [
            2252.9296875,
            2204.58984375
          ]
        },
        "Vondarc": {
          "source": [
            179,
            147
          ],
          "target": [
            2203.125,
            1363.76953125
          ]
        }
      },
      "source_coordinate_system": "DustigSector_pixels",
      "target_coordinate_system": "system_pixels"
    },
    "EssentialAtlas1_to_system_pixels": {
      "anchors": {
        "Darkknell": {
          "source": [
            142,
            117
          ],
          "target": [
            2068,
            1378
          ]
        },
        "Eriadu": {
          "source": [
            114,
            178
          ],
          "target": [
            1768,
            2081
          ]
        },
        "Kabal": {
          "source": [
            178,
            197
          ],
          "target": [
            2589,
            2328
          ]
        },
        "Sharllissia": {
          "source": [
            221,
            169
          ],
          "target": [
            3090,
            1940
          ]
        },
        "Sluis Van": {
          "source": [
            120,
            249
          ],
          "target": [
            1802,
            2945
          ]
        },
        "Syned": {
          "source": [
            166,
            129
          ],
          "target": [
            2374,
            1500
          ]
        }
      },
      "source_coordinate_system": "EA1_pixels",
      "target_coordinate_system": "system_pixels"
    },
    "Grumani_to_system_pixels": {
      "anchors": {
        "Cmaoli Di": {
          "source": [
            107,
            700
          ],
          "target": [
            2680.6640625,
            2660.15625
          ]
        },
        "Darkknell": {
          "source": [
            218,
            419
          ],
          "target": [
            2752.44140625,
            2414.0625
          ]
        },
        "Sanrafsix": {
          "source": [
            793,
            241
          ],
          "target": [
            3224.12109375,
            2214.84375
          ]
        },
        "Sarrassia": {
          "source": [
            484,
            331
          ],
          "target": [
            3114.2578125,
            2286.62109375
          ]
        },
        "Syned": {
          "source": [
            705,
            674
          ],
          "target": [
            3200.68359375,
            2592.7734375
          ]
        }
      },
      "source_coordinate_system": "Grumani_pixels",
      "target_coordinate_system": "system_pixels"
    },
    "MapSnip_to_system_pixels": {
      "anchors": {
        "Atravis": {
          "source": [
            98,
            437
          ],
          "target": [
            880,
            3287
          ]
        },
        "Crait": {
          "source": [
            377,
            131
          ],
          "target": [
            2749,
            1230
          ]
        },
        "Eriadu": {
          "source": [
            231,
            258
          ],
          "target": [
            1768,
            2081
          ]
        },
        "Kabal": {
          "source": [
            354,
            295
          ],
          "target": [
            2589,
            2328
          ]
        },
        "Sharllissia": {
          "source": [
            429,
            237
          ],
          "target": [
            3090,
            1940
          ]
        },
        "Sluis Van": {
          "source": [
            236,
            387
          ],
          "target": [
            1802,
            2945
          ]
        },
        "Sullust": {
          "source": [
            229,
            187
          ],
          "target": [
            1754,
            1606
          ]
        }
      },
      "source_coordinate_system": "MapSnip_pixels",
      "target_coordinate_system": "system_pixels"
    },
    "OcclusionZone_to_system_pixels": {
      "anchors": {
        "Arbra": {
          "source": [
            335,
            120
          ],
          "target": [
            4152.83203125,
            2550.29296875
          ]
        },
        "Clak'dor": {
          "source": [
            128,
            293
          ],
          "target": [
            2342.28515625,
            4091.30859375
          ]
        },
        "Eriadu": {
          "source": [
            123,
            222
          ],
          "target": [
            2312.98828125,
            3443.84765625
          ]
        },
        "Kabal": {
          "source": [
            257,
            260
          ],
          "target": [
            3515.625,
            3805.6640625
          ]
        },
        "Pamarthe": {
          "source": [
            232,
            278
          ],
          "target": [
            3291.50390625,
            3953.61328125
          ]
        },
        "Sharlissia": {
          "source": [
            339,
            199
          ],
          "target": [
            4249.51171875,
            3237.3046875
          ]
        },
        "Sluis Van": {
          "source": [
            131,
            362
          ],
          "target": [
            2362.79296875,
            4709.47265625
          ]
        },
        "Sullust": {
          "source": [
            122,
            143
          ],
          "target": [
            2292.48046875,
            2748.046875
          ]
        }
      },
      "source_coordinate_system": "OcclusionZone_pixels",
      "target_coordinate_system": "system_pixels"
    },
    "SenexEA_to_system_pixels": {
      "anchors": {
        "Dolla": {
          "source": [
            114,
            174
          ],
          "target": [
            412,
            2215
          ]
        },
        "Dorvalla": {
          "source": [
            240,
            171
          ],
          "target": [
            1574,
            2212
          ]
        },
        "Eiattu": {
          "source": [
            184,
            77
          ],
          "target": [
            1102,
            1306
          ]
        },
        "Karfeddion": {
          "source": [
            127,
            132
          ],
          "target": [
            607,
            1824
          ]
        },
        "Kelrodo-Ai": {
          "source": [
            155,
            230
          ],
          "target": [
            783,
            2769
          ]
        },
        "Ogem": {
          "source": [
            98,
            107
          ],
          "target": [
            288,
            1484
          ]
        },
        "Tibrin": {
          "source": [
            165,
            129
          ],
          "target": [
            1019,
            1813
          ]
        },
        "Vondarc": {
          "source": [
            248,
            9
          ],
          "target": [
            1693,
            661
          ]
        }
      },
      "source_coordinate_system": "SenexEA_pixels",
      "target_coordinate_system": "system_pixels"
    },
    "SenexJuvex_to_system_pixels": {
      "anchors": {
        "Belsavis": {
          "source": [
            752,
            699
          ],
          "target": [
            619,
            1988
          ]
        },
        "Karfeddion": {
          "source": [
            736,
            546
          ],
          "target": [
            607,
            1824
          ]
        },
        "Ogem": {
          "source": [
            274,
            39
          ],
          "target": [
            288,
            1484
          ]
        },
        "Velga": {
          "source": [
            309,
            655
          ],
          "target": [
            357,
            1843
          ]
        }
      },
      "source_coordinate_system": "SenexJuvex_pixels",
      "target_coordinate_system": "system_pixels"
    },
    "WesternReaches_to_system_pixels": {
      "anchors": {
        "Clak'dor": {
          "source": [
            491,
            669
          ],
          "target": [
            1788,
            2523
          ]
        },
        "Dagobah": {
          "source": [
            499,
            773
          ],
          "target": [
            1876,
            3367
          ]
        },
        "Eriadu": {
          "source": [
            489,
            605
          ],
          "target": [
            1768,
            2081
          ]
        },
        "Karfeddion": {
          "source": [
            325,
            572
          ],
          "target": [
            607,
            1824
          ]
        },
        "Sluis Van": {
          "source": [
            499,
            722
          ],
          "target": [
            1802,
            2945
          ]
        },
        "Sullust": {
          "source": [
            489,
            538
          ],
          "target": [
            1754,
            1606
          ]
        }
      },
      "source_coordinate_system": "WesternReaches_pixels",
      "target_coordinate_system": "system_pixels"
    }
  },
  "reference_sources": {
    "DustigSector": {
      "coordinate_system": "DustigSector_pixels",
      "description": "Dustig Sector reference map.",
      "file_hint": "DustigSector.png",
      "id": "DustigSector",
      "type": "image"
    },
    "EssentialAtlas1": {
      "coordinate_system": "EA1_pixels",
      "description": "Essential Atlas slice around Bon'nyuw-Luq / Seswenna / Sluis sectors.",
      "file_hint": "/mnt/data/BonnyuwLuqOuterRim.webp",
      "id": "EssentialAtlas1",
      "type": "image"
    },
    "Grumani": {
      "coordinate_system": "Grumani_pixels",
      "description": "Grumani sector reference map.",
      "file_hint": "Grumani.png",
      "id": "Grumani",
      "type": "image"
    },
    "MapSnip": {
      "coordinate_system": "MapSnip_pixels",
      "description": "Primary base map used for system_pixels.",
      "file_hint": "/mnt/data/MapSnip.png",
      "id": "MapSnip",
      "type": "image"
    },
    "OcclusionZone": {
      "coordinate_system": "OcclusionZone_pixels",
      "description": "Occlusion Zone reference map for local occlusion overlay and cross-check.",
      "file_hint": "OcclusionZone.png",
      "id": "OcclusionZone",
      "type": "image"
    },
    "SenexEA": {
      "coordinate_system": "SenexEA_pixels",
      "description": "Essential Atlas Senex / Juvex region reference slice.",
      "file_hint": "/mnt/data/SenexEA.png",
      "id": "SenexEA",
      "type": "image"
    },
    "SenexJuvex": {
      "coordinate_system": "SenexJuvex_pixels",
      "description": "Senex/Juvex region reference map.",
      "file_hint": "/mnt/data/SenexJuvex.png",
      "id": "SenexJuvex",
      "type": "image"
    },
    "WesternReaches": {
      "coordinate_system": "WesternReaches_pixels",
      "description": "Western Reaches sector map reference.",
      "file_hint": "/mnt/data/WesternReaches.png",
      "id": "WesternReaches",
      "type": "image"
    }
  },
  "route_metadata": {
    "Ado Spine": {
      "route_class": "medium"
    },
    "Duros Space Run": {
      "route_class": "medium"
    },
    "Dustig Trace": {
      "route_class": "medium"
    },
    "Enarc Run": {
      "route_class": "medium"
    },
    "Hydian Way": {
      "route_class": "major"
    },
    "Karfeddion–Eriadu Hyperlane": {
      "route_class": "medium"
    },
    "Lipsec Run": {
      "route_class": "medium"
    },
    "Nothoiin Corridor": {
      "route_class": "medium"
    },
    "Rimma Trade Route": {
      "route_class": "major"
    },
    "Sanrafsix Corridor": {
      "route_class": "medium"
    },
    "Sharlissia Trade Corridor": {
      "route_class": "medium"
    },
    "Var-Shaa Spur": {
      "route_class": "medium"
    }
  },
  "sector_boundaries": {
    "Bonnyuw": {
      "points": [
        [
          2261,
          1570
        ],
        [
          2511,
          1450
        ],
        [
          2740,
          1370
        ],
        [
          2861,
          1420
        ],
        [
          2931,
          1740
        ],
        [
          3001,
          1930
        ],
        [
          3011,
          2210
        ],
        [
          2971,
          2420
        ],
        [
          2711,
          2620
        ],
        [
          2511,
          2620
        ],
        [
          2311,
          2170
        ]
      ],
      "type": "polygon"
    }
  },
  "sectors": {
    "Ado": [
      "Tshindral",
      "Indupar",
      "Medth"
    ],
    "Alui": [
      "Enarc",
      "Alui"
    ],
    "Bon'nyuw-Luq": [
      "Arbra",
      "Cerroban",
      "Crait",
      "Destreg",
      "Felne",
      "Gonda",
      "Luxiar",
      "Nellac Kram",
      "Oanne",
      "Oetchi",
      "Sharlissia",
      "Speco",
      "Verdanth",
      "Yethra",
      "Zairona"
    ],
    "Bozhnee": [
      "Belsavis"
    ],
    "Brema": [
      "Sullust",
      "Orish",
      "Gad",
      "Bortras",
      "Dolla",
      "Pipada",
      "Callos",
      "Cmaoli Di",
      "Najan-Rovi"
    ],
    "D'Aelgoth": [
      "Tiferep",
      "Ogem"
    ],
    "Dustig": [
      "Chryya",
      "Loposi",
      "Var-Shaa",
      "Nuvar",
      "ZeHeth",
      "Demos",
      "Kath"
    ],
    "Garis": [
      "Omwat"
    ],
    "Grumani": [
      "Sanrafsix",
      "Sarrassia",
      "Darkknell",
      "Kessar",
      "Cyclor",
      "Polaar",
      "Haruun Kal",
      "Malastare",
      "Naboo",
      "Vondarc",
      "Eiattu",
      "Karfeddion",
      "Syned",
      "Baraan-Fa",
      "Aquilaris Minor",
      "Gazzari",
      "Greeve",
      "Heptooine",
      "Jutrand",
      "Kamasto",
      "Nilash",
      "Chelloa",
      "Phaegon",
      "Tanta Aurek",
      "Tramaos"
    ],
    "Hadar": [
      "Tibrin"
    ],
    "Juvex": [
      "Velga",
      "Juvex"
    ],
    "Kira": [
      "Nigel",
      "Roldalna",
      "Pax",
      "Ropagi"
    ],
    "Mayagil": [
      "H'Nemthe",
      "Blarrum",
      "Arli"
    ],
    "Mulgard": [
      "Umgul and Dargul",
      "Seltos"
    ],
    "Quess": [
      "Old Mankoo",
      "Trevi"
    ],
    "Sanbra": [
      "Sanbra"
    ],
    "Senex": [
      "Neelanon",
      "Senex"
    ],
    "Seswenna": [
      "Eriadu",
      "Parwa",
      "Uvena",
      "Rilias",
      "Seswenna",
      "Averam",
      "Dorvalla"
    ],
    "Sluis": [
      "Sluis Van",
      "Orto",
      "Praesitlyn",
      "Atravis",
      "Triton",
      "Clak'dor",
      "Kerest",
      "Vixoseph",
      "Dagobah",
      "Kelrodo-Ai",
      "Shumavar",
      "Denab and Seatos",
      "Dorlo"
    ],
    "Spirva": [
      "Naalol"
    ],
    "Svivreni": [
      "Svivren"
    ],
    "Tamarin": [
      "Kabal",
      "Daxam",
      "Xagobah",
      "Pamarthe",
      "Rior",
      "Sevarcos",
      "Bartokan",
      "Kirdo",
      "Stygmarn",
      "Valo",
      "Ord Grovner",
      "Sag Kemper",
      "Paucris"
    ],
    "Toblain": [
      "Shadda-Bi-Boran",
      "Boneworld"
    ],
    "Tyus": [
      "Nuralee"
    ],
    "Var Hagen": [
      "Vogel",
      "Lanthe",
      "Alakatha",
      "Opiteihr"
    ],
    "Vilonis": [
      "Kalinda",
      "Alassa Major"
    ]
  },
  "system_grid": {
    "Alakatha": {
      "col": "M",
      "grid": "M-16",
      "row": 16
    },
    "Alassa Major": {
      "col": "O",
      "grid": "O-16",
      "row": 16
    },
    "Alui": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Aquilaris Minor": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Arbra": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Arli": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Atravis": {
      "col": "L",
      "grid": "L-19",
      "row": 19
    },
    "Averam": {
      "col": "M",
      "grid": "M-18",
      "row": 18
    },
    "Baraan-Fa": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Bartokan": {
      "col": "N",
      "grid": "N-19",
      "row": 19
    },
    "Belsavis": {
      "col": "L",
      "grid": "L-18",
      "row": 18
    },
    "Blarrum": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Boneworld": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Bortras": {
      "col": "M",
      "grid": "M-18",
      "row": 18
    },
    "Callos": {
      "col": "M",
      "grid": "M-17",
      "row": 17
    },
    "Cerroban": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Chelloa": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Chryya": {
      "col": "M",
      "grid": "M-17",
      "row": 17
    },
    "Clak'dor": {
      "col": "M",
      "grid": "M-18",
      "row": 18
    },
    "Cmaoli Di": {
      "col": "M",
      "grid": "M-17",
      "row": 17
    },
    "Crait": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Cyclor": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Dagobah": {
      "col": "M",
      "grid": "M-19",
      "row": 19
    },
    "Darkknell": {
      "col": "M",
      "grid": "M-17",
      "row": 17
    },
    "Daxam": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Demos": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Denab and Seatos": {
      "col": "M",
      "grid": "M-19",
      "row": 19
    },
    "Destreg": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Dolla": {
      "col": "L",
      "grid": "L-18",
      "row": 18
    },
    "Dorlo": {
      "col": "L",
      "grid": "L-19",
      "row": 19
    },
    "Dorvalla": {
      "col": "M",
      "grid": "M-18",
      "row": 18
    },
    "Eiattu": {
      "col": "L",
      "grid": "L-17",
      "row": 17
    },
    "Enarc": {
      "col": "O",
      "grid": "O-16",
      "row": 16
    },
    "Eriadu": {
      "col": "M",
      "grid": "M-18",
      "row": 18
    },
    "Felne": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Gad": {
      "col": "M",
      "grid": "M-17",
      "row": 17
    },
    "Gazzari": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Gonda": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Greeve": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "H'Nemthe": {
      "col": "M",
      "grid": "M-18",
      "row": 18
    },
    "Haruun Kal": {
      "col": "M",
      "grid": "M-17",
      "row": 17
    },
    "Heptooine": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Indupar": {
      "col": "M",
      "grid": "M-17",
      "row": 17
    },
    "Jutrand": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Juvex": {
      "col": "L",
      "grid": "L-18",
      "row": 18
    },
    "Kabal": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Kalinda": {
      "col": "O",
      "grid": "O-16",
      "row": 16
    },
    "Kamasto": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Karfeddion": {
      "col": "L",
      "grid": "L-18",
      "row": 18
    },
    "Kath": {
      "col": "M",
      "grid": "M-16",
      "row": 16
    },
    "Kelrodo-Ai": {
      "col": "L",
      "grid": "L-18",
      "row": 18
    },
    "Kerest": {
      "col": "M",
      "grid": "M-19",
      "row": 19
    },
    "Kessar": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Kirdo": {
      "col": "N",
      "grid": "N-19",
      "row": 19
    },
    "Lanthe": {
      "col": "M",
      "grid": "M-16",
      "row": 16
    },
    "Loposi": {
      "col": "M",
      "grid": "M-17",
      "row": 17
    },
    "Luxiar": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Malastare": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Medth": {
      "col": "M",
      "grid": "M-17",
      "row": 17
    },
    "Naalol": {
      "col": "L",
      "grid": "L-17",
      "row": 17
    },
    "Naboo": {
      "col": "O",
      "grid": "O-17",
      "row": 17
    },
    "Najan-Rovi": {
      "col": "M",
      "grid": "M-17",
      "row": 17
    },
    "Neelanon": {
      "col": "L",
      "grid": "L-17",
      "row": 17
    },
    "Nellac Kram": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Nigel": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Nilash": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Nuralee": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Nuvar": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Oanne": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Oetchi": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Ogem": {
      "col": "L",
      "grid": "L-17",
      "row": 17
    },
    "Old Mankoo": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Omwat": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Opiteihr": {
      "col": "M",
      "grid": "M-16",
      "row": 16
    },
    "Ord Grovner": {
      "col": "O",
      "grid": "O-18",
      "row": 18
    },
    "Orish": {
      "col": "M",
      "grid": "M-17",
      "row": 17
    },
    "Orto": {
      "col": "M",
      "grid": "M-19",
      "row": 19
    },
    "Pamarthe": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Parwa": {
      "col": "M",
      "grid": "M-18",
      "row": 18
    },
    "Paucris": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Pax": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Phaegon": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Pipada": {
      "col": "M",
      "grid": "M-18",
      "row": 18
    },
    "Polaar": {
      "col": "L",
      "grid": "L-16",
      "row": 16
    },
    "Praesitlyn": {
      "col": "M",
      "grid": "M-19",
      "row": 19
    },
    "Rilias": {
      "col": "M",
      "grid": "M-18",
      "row": 18
    },
    "Rior": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Roldalna": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Ropagi": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Sag Kemper": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Sanbra": {
      "col": "O",
      "grid": "O-17",
      "row": 17
    },
    "Sanrafsix": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Sarrassia": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Seltos": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Senex": {
      "col": "L",
      "grid": "L-17",
      "row": 17
    },
    "Seswenna": {
      "col": "M",
      "grid": "M-18",
      "row": 18
    },
    "Sevarcos": {
      "col": "N",
      "grid": "N-19",
      "row": 19
    },
    "Shadda-Bi-Boran": {
      "col": "O",
      "grid": "O-18",
      "row": 18
    },
    "Sharlissia": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Shumavar": {
      "col": "L",
      "grid": "L-19",
      "row": 19
    },
    "Sluis Van": {
      "col": "M",
      "grid": "M-19",
      "row": 19
    },
    "Speco": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "Stygmarn": {
      "col": "N",
      "grid": "N-19",
      "row": 19
    },
    "Sullust": {
      "col": "M",
      "grid": "M-17",
      "row": 17
    },
    "Svivren": {
      "col": "O",
      "grid": "O-19",
      "row": 19
    },
    "Syned": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Tanta Aurek": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Tibrin": {
      "col": "L",
      "grid": "L-18",
      "row": 18
    },
    "Tiferep": {
      "col": "L",
      "grid": "L-17",
      "row": 17
    },
    "Tramaos": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Trevi": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Triton": {
      "col": "M",
      "grid": "M-18",
      "row": 18
    },
    "Tshindral": {
      "col": "M",
      "grid": "M-17",
      "row": 17
    },
    "Umgul and Dargul": {
      "col": "N",
      "grid": "N-16",
      "row": 16
    },
    "Uvena": {
      "col": "M",
      "grid": "M-18",
      "row": 18
    },
    "Valo": {
      "col": "N",
      "grid": "N-19",
      "row": 19
    },
    "Var-Shaa": {
      "col": "M",
      "grid": "M-17",
      "row": 17
    },
    "Velga": {
      "col": "L",
      "grid": "L-18",
      "row": 18
    },
    "Verdanth": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Vixoseph": {
      "col": "M",
      "grid": "M-19",
      "row": 19
    },
    "Vogel": {
      "col": "M",
      "grid": "M-16",
      "row": 16
    },
    "Vondarc": {
      "col": "M",
      "grid": "M-16",
      "row": 16
    },
    "Xagobah": {
      "col": "M",
      "grid": "M-18",
      "row": 18
    },
    "Yethra": {
      "col": "N",
      "grid": "N-17",
      "row": 17
    },
    "Zairona": {
      "col": "N",
      "grid": "N-18",
      "row": 18
    },
    "ZeHeth": {
      "col": "M",
      "grid": "M-16",
      "row": 16
    }
  },
  "system_pixels": {
    "Alakatha": [
      2051.6843510435106,
      919.3266341031945
    ],
    "Alassa Major": [
      5032.492382942901,
      760.5401006641214
    ],
    "Alui": [
      4631.095688669398,
      1925.991708636702
    ],
    "Aquilaris Minor": [
      2883.3485465584718,
      2137.1501256075435
    ],
    "Arbra": [
      4152.83203125,
      2550.29296875
    ],
    "Arli": [
      3449.67240097359,
      3965.488565343676
    ],
    "Atravis": [
      1012.20703125,
      5210.44921875
    ],
    "Averam": [
      2124.0234375,
      3738.28125
    ],
    "Baraan-Fa": [
      3081,
      2248
    ],
    "Bartokan": [
      4378.41796875,
      4659.66796875
    ],
    "Belsavis": [
      629.8828125,
      3307.6171875
    ],
    "Blarrum": [
      3399.365921632477,
      3365.3044343825595
    ],
    "Boneworld": [
      4385.559833340295,
      3698.2079669840277
    ],
    "Bortras": [
      2150.390625,
      3276.85546875
    ],
    "Callos": [
      2135.7421875,
      2983.88671875
    ],
    "Cerroban": [
      3849.609375,
      3700.1953125
    ],
    "Chelloa": [
      2833.211021828453,
      2512.794995194524
    ],
    "Chryya": [
      2898.92578125,
      1999.51171875
    ],
    "Clak'dor": [
      2342.28515625,
      4091.30859375
    ],
    "Cmaoli Di": [
      2680.6640625,
      2660.15625
    ],
    "Crait": [
      3750,
      2197.265625
    ],
    "Cyclor": [
      4101.5625,
      2000.9765625
    ],
    "Dagobah": [
      2471.19140625,
      5327.63671875
    ],
    "Darkknell": [
      2752.44140625,
      2414.0625
    ],
    "Daxam": [
      3427.734375,
      3502.44140625
    ],
    "Demos": [
      3303.6649997875215,
      839.773186423685
    ],
    "Denab and Seatos": [
      2355.46875,
      4986.328125
    ],
    "Destreg": [
      3561.03515625,
      3618.1640625
    ],
    "Dolla": [
      326.66015625,
      3640.13671875
    ],
    "Dorlo": [
      282.71484375,
      4955.56640625
    ],
    "Dorvalla": [
      2028.80859375,
      3635.7421875
    ],
    "Eiattu": [
      1337.40234375,
      2308.59375
    ],
    "Enarc": [
      5104.811474616616,
      1752.1217298403055
    ],
    "Eriadu": [
      2312.98828125,
      3443.84765625
    ],
    "Felne": [
      3531.73828125,
      2812.5
    ],
    "Gad": [
      1617.1875,
      2825.68359375
    ],
    "Gazzari": [
      2971.1507093676473,
      2367.9648598327935
    ],
    "Gonda": [
      4352.05078125,
      3544.921875
    ],
    "Greeve": [
      3220.316917432314,
      2132.5340743006664
    ],
    "H'Nemthe": [
      2068.359375,
      4258.30078125
    ],
    "Haruun Kal": [
      2623.53515625,
      1727.05078125
    ],
    "Heptooine": [
      3115.1970748598987,
      2241.081257910042
    ],
    "Indupar": [
      2147.4609375,
      1946.77734375
    ],
    "Jutrand": [
      2988.96683356832,
      2278.4342651321294
    ],
    "Juvex": [
      380.859375,
      3014.6484375
    ],
    "Kabal": [
      3515.625,
      3805.6640625
    ],
    "Kalinda": [
      4835.010107870952,
      385.2327605070982
    ],
    "Kamasto": [
      2855.7495719943154,
      2219.61138966494
    ],
    "Karfeddion": [
      612.3046875,
      3067.3828125
    ],
    "Kath": [
      2554.919913912784,
      1629.816769064402
    ],
    "Kelrodo-Ai": [
      870.1171875,
      4451.66015625
    ],
    "Kerest": [
      1863.28125,
      5248.53515625
    ],
    "Kessar": [
      3632.8125,
      2061.03515625
    ],
    "Kirdo": [
      3987.3046875,
      5110.83984375
    ],
    "Lanthe": [
      2110.516280102425,
      1160.5498725012883
    ],
    "Loposi": [
      2575,
      1933
    ],
    "Luxiar": [
      3971.19140625,
      3032.2265625
    ],
    "Malastare": [
      3093.75,
      1256.8359375
    ],
    "Naalol": [
      377.9296875,
      1514.6484375
    ],
    "Naboo": [
      5021.484375,
      1608.3984375
    ],
    "Najan-Rovi": [
      2292.48046875,
      2531.25
    ],
    "Neelanon": [
      672.36328125,
      2983.88671875
    ],
    "Nellac Kram": [
      3824.70703125,
      3500.9765625
    ],
    "Nigel": [
      4449.438403119508,
      157.1891023420785
    ],
    "Nilash": [
      2807.3171912608195,
      2487.767745185525
    ],
    "Nuralee": [
      3624.8654051204016,
      518.4106956924663
    ],
    "Nuvar": [
      3250.9579378599565,
      1697.2798670386526
    ],
    "Oanne": [
      4249.51171875,
      2825.68359375
    ],
    "Oetchi": [
      3877.44140625,
      2383.30078125
    ],
    "Ogem": [
      145.01953125,
      2569.3359375
    ],
    "Old Mankoo": [
      3643.651095905304,
      1563.5527399905202
    ],
    "Omwat": [
      3373.53515625,
      3111.328125
    ],
    "Opiteihr": [
      2744.591426526533,
      812.5993913611026
    ],
    "Ord Grovner": [
      5119.62890625,
      4075.1953125
    ],
    "Orish": [
      2576.66015625,
      2875.48828125
    ],
    "Orto": [
      1990.72265625,
      4885.25390625
    ],
    "Pamarthe": [
      3291.50390625,
      3953.61328125
    ],
    "Parwa": [
      2311.5234375,
      3080.56640625
    ],
    "Paucris": [
      4209.2489780757805,
      3957.68770098041
    ],
    "Pax": [
      3267.7462961402134,
      357.3816288137732
    ],
    "Phaegon": [
      3325.8577140505304,
      2302.859664350645
    ],
    "Pipada": [
      1608.3984375,
      3698.73046875
    ],
    "Polaar": [
      921.38671875,
      1335.9375
    ],
    "Praesitlyn": [
      2352.5390625,
      4502.9296875
    ],
    "Rilias": [
      2214.84375,
      3895.01953125
    ],
    "Rior": [
      3682.6171875,
      4070.80078125
    ],
    "Roldalna": [
      4353.828214047684,
      143.72577297990927
    ],
    "Ropagi": [
      3780.407921806291,
      76.34505378507345
    ],
    "Sag Kemper": [
      3756.3888167849636,
      4270.487543738858
    ],
    "Sanbra": [
      4759.27734375,
      2305.6640625
    ],
    "Sanrafsix": [
      3224.12109375,
      2214.84375
    ],
    "Sarrassia": [
      3114.2578125,
      2286.62109375
    ],
    "Seltos": [
      4252.782467008807,
      585.8280276781531
    ],
    "Senex": [
      669.43359375,
      2935.546875
    ],
    "Seswenna": [
      2419.921875,
      3572.75390625
    ],
    "Sevarcos": [
      3418.9453125,
      4768.06640625
    ],
    "Shadda-Bi-Boran": [
      4835.44921875,
      3071.77734375
    ],
    "Sharlissia": [
      4249.51171875,
      3237.3046875
    ],
    "Shumavar": [
      1289.0625,
      4858.88671875
    ],
    "Sluis Van": [
      2362.79296875,
      4709.47265625
    ],
    "Speco": [
      3751.46484375,
      3178.7109375
    ],
    "Stygmarn": [
      3498.046875,
      5248.53515625
    ],
    "Sullust": [
      2292.48046875,
      2748.046875
    ],
    "Svivren": [
      5453.61328125,
      5059.5703125
    ],
    "Syned": [
      3200.68359375,
      2592.7734375
    ],
    "Tanta Aurek": [
      2713.7352407992485,
      2600.5923873090064
    ],
    "Tibrin": [
      1215.8203125,
      3051.26953125
    ],
    "Tiferep": [
      95.21484375,
      2233.88671875
    ],
    "Tramaos": [
      3059.284961163079,
      2455.336827610209
    ],
    "Trevi": [
      3989.5544343692395,
      1858.565223453302
    ],
    "Triton": [
      2362.79296875,
      4346.19140625
    ],
    "Tshindral": [
      2252.9296875,
      2204.58984375
    ],
    "Umgul and Dargul": [
      3805.6640625,
      1133.7890625
    ],
    "Uvena": [
      2693.84765625,
      3218.26171875
    ],
    "Valo": [
      4064.94140625,
      5453.61328125
    ],
    "Var-Shaa": [
      2843,
      1828
    ],
    "Velga": [
      246.09375,
      3095.21484375
    ],
    "Verdanth": [
      4013.671875,
      2100.5859375
    ],
    "Vixoseph": [
      1981.93359375,
      5532.71484375
    ],
    "Vogel": [
      2496.09375,
      1136.71875
    ],
    "Vondarc": [
      2203.125,
      1363.76953125
    ],
    "Xagobah": [
      2812.5,
      4070.80078125
    ],
    "Yethra": [
      3604.98046875,
      2446.2890625
    ],
    "Zairona": [
      4410.64453125,
      3178.7109375
    ],
    "ZeHeth": [
      3157.6523582910345,
      1054.0606128997276
    ]
  },
  "systems": {
    "Alakatha": {
      "coords": [
        2051.6843510435106,
        919.3266341031945
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [
          "Rimma Trade Route"
        ],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Var Hagen"
    },
    "Alassa Major": {
      "coords": [
        5032.492382942901,
        760.5401006641214
      ],
      "editor_notes": "",
      "grid": {
        "col": "O",
        "grid": "O-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Enarc Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Vilonis"
    },
    "Alui": {
      "coords": [
        4631.095688669398,
        1925.991708636702
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Alui"
    },
    "Aquilaris Minor": {
      "coords": [
        2883.3485465584718,
        2137.1501256075435
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [
          "Hydian Way"
        ],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Arbra": {
      "coords": [
        4152.83203125,
        2550.29296875
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Crait",
          "Yethra",
          "Luxiar",
          "Verdanth"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "Arli": {
      "coords": [
        3449.67240097359,
        3965.488565343676
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Mayagil"
    },
    "Atravis": {
      "coords": [
        1012.20703125,
        5210.44921875
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [
          "Hydian Way"
        ],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Sluis"
    },
    "Averam": {
      "coords": [
        2124.0234375,
        3738.28125
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [
          "Hydian Way"
        ],
        "medium": [],
        "minor_neighbors": [
          "Rilias"
        ]
      },
      "sector": "Seswenna"
    },
    "Baraan-Fa": {
      "coords": [
        3081,
        2248
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Duros Space Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Bartokan": {
      "coords": [
        4378.41796875,
        4659.66796875
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Ord Grovner",
          "Kirdo"
        ]
      },
      "sector": "Tamarin"
    },
    "Belsavis": {
      "coords": [
        629.8828125,
        3307.6171875
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Bortras"
        ]
      },
      "sector": "Bozhnee"
    },
    "Blarrum": {
      "coords": [
        3399.365921632477,
        3365.3044343825595
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Sanrafsix Corridor"
        ],
        "minor_neighbors": []
      },
      "sector": "Mayagil"
    },
    "Boneworld": {
      "coords": [
        4385.559833340295,
        3698.2079669840277
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Toblain"
    },
    "Bortras": {
      "coords": [
        2150.390625,
        3276.85546875
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Belsavis",
          "Eriadu",
          "Gad"
        ]
      },
      "sector": "Brema"
    },
    "Callos": {
      "coords": [
        2135.7421875,
        2983.88671875
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-17",
        "row": 17
      },
      "labels": {
        "preferred_dir": "above"
      },
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Eriadu",
          "Gad",
          "Sullust"
        ]
      },
      "sector": "Brema"
    },
    "Cerroban": {
      "coords": [
        3849.609375,
        3700.1953125
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Nellac Kram"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "Chelloa": {
      "coords": [
        2833.211021828453,
        2512.794995194524
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Chryya": {
      "coords": [
        2898.92578125,
        1999.51171875
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [
          "Hydian Way"
        ],
        "medium": [
          "Var-Shaa Spur"
        ],
        "minor_neighbors": []
      },
      "sector": "Dustig"
    },
    "Clak'dor": {
      "coords": [
        2342.28515625,
        4091.30859375
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [
          "Rimma Trade Route"
        ],
        "medium": [],
        "minor_neighbors": [
          "H'Nemthe",
          "Rilias"
        ]
      },
      "sector": "Sluis"
    },
    "Cmaoli Di": {
      "coords": [
        2680.6640625,
        2660.15625
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [
          "Hydian Way"
        ],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Brema"
    },
    "Crait": {
      "coords": [
        3750,
        2197.265625
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Arbra",
          "Kessar",
          "Oetchi"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "Cyclor": {
      "coords": [
        4101.5625,
        2000.9765625
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Duros Space Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Dagobah": {
      "coords": [
        2471.19140625,
        5327.63671875
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Sluis"
    },
    "Darkknell": {
      "coords": [
        2752.44140625,
        2414.0625
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [
          "Hydian Way"
        ],
        "medium": [
          "Duros Space Run"
        ],
        "minor_neighbors": [
          "Najan-Rovi"
        ]
      },
      "sector": "Grumani"
    },
    "Daxam": {
      "coords": [
        3427.734375,
        3502.44140625
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {
        "preferred_dir": "left"
      },
      "routes": {
        "major": [],
        "medium": [
          "Sanrafsix Corridor"
        ],
        "minor_neighbors": [
          "Rior"
        ]
      },
      "sector": "Tamarin"
    },
    "Demos": {
      "coords": [
        3303.6649997875215,
        839.773186423685
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Dustig Trace"
        ],
        "minor_neighbors": []
      },
      "sector": "Dustig"
    },
    "Denab and Seatos": {
      "coords": [
        2355.46875,
        4986.328125
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-19",
        "row": 19
      },
      "labels": {
        "preferred_dir": "below"
      },
      "routes": {
        "major": [
          "Rimma Trade Route"
        ],
        "medium": [],
        "minor_neighbors": [
          "Vixoseph"
        ]
      },
      "sector": "Sluis"
    },
    "Destreg": {
      "coords": [
        3561.03515625,
        3618.1640625
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {
        "preferred_dir": "left"
      },
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Gonda"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "Dolla": {
      "coords": [
        326.66015625,
        3640.13671875
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Gerrenthum–Eriadu Hyperlane"
        ],
        "minor_neighbors": []
      },
      "sector": "Brema"
    },
    "Dorlo": {
      "coords": [
        282.71484375,
        4955.56640625
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Sluis"
    },
    "Dorvalla": {
      "coords": [
        2028.80859375,
        3635.7421875
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Lipsec Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Seswenna"
    },
    "Eiattu": {
      "coords": [
        1337.40234375,
        2308.59375
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Ado Spine"
        ],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Enarc": {
      "coords": [
        5104.811474616616,
        1752.1217298403055
      ],
      "editor_notes": "",
      "grid": {
        "col": "O",
        "grid": "O-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Duros Space Run",
          "Enarc Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Alui"
    },
    "Eriadu": {
      "coords": [
        2312.98828125,
        3443.84765625
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [
          "Rimma Trade Route"
        ],
        "medium": [
          "Gerrenthum–Eriadu Hyperlane",
          "Lipsec Run",
          "Karfeddion–Eriadu Hyperlane"
        ],
        "minor_neighbors": [
          "Bortras",
          "Callos",
          "Pipada",
          "Uvena"
        ]
      },
      "sector": "Seswenna"
    },
    "Felne": {
      "coords": [
        3531.73828125,
        2812.5
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Omwat",
          "Yethra"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "Gad": {
      "coords": [
        1617.1875,
        2825.68359375
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Karfeddion–Eriadu Hyperlane"
        ],
        "minor_neighbors": [
          "Bortras",
          "Callos",
          "Tibrin"
        ]
      },
      "sector": "Brema"
    },
    "Gazzari": {
      "coords": [
        2971.1507093676473,
        2367.9648598327935
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Gonda": {
      "coords": [
        4352.05078125,
        3544.921875
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {
        "preferred_dir": "below"
      },
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Destreg",
          "Luxiar"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "Greeve": {
      "coords": [
        3220.316917432314,
        2132.5340743006664
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "H'Nemthe": {
      "coords": [
        2068.359375,
        4258.30078125
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Clak'dor",
          "Kerest"
        ]
      },
      "sector": "Mayagil"
    },
    "Haruun Kal": {
      "coords": [
        2623.53515625,
        1727.05078125
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Loposi",
          "Var-Shaa"
        ]
      },
      "sector": "Dustig"
    },
    "Heptooine": {
      "coords": [
        3115.1970748598987,
        2241.081257910042
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Duros Space Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Indupar": {
      "coords": [
        2147.4609375,
        1946.77734375
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Ado Spine"
        ],
        "minor_neighbors": []
      },
      "sector": "Ado"
    },
    "Jutrand": {
      "coords": [
        2988.96683356832,
        2278.4342651321294
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Duros Space Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Juvex": {
      "coords": [
        380.859375,
        3014.6484375
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-18",
        "row": 18
      },
      "labels": {
        "preferred_dir": "left"
      },
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Juvex"
    },
    "Kabal": {
      "coords": [
        3515.625,
        3805.6640625
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Sanrafsix Corridor",
          "Sharlissia Trade Corridor"
        ],
        "minor_neighbors": [
          "Pamarthe"
        ]
      },
      "sector": "Tamarin"
    },
    "Kalinda": {
      "coords": [
        4835.010107870952,
        385.2327605070982
      ],
      "editor_notes": "",
      "grid": {
        "col": "O",
        "grid": "O-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Enarc Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Vilonis"
    },
    "Kamasto": {
      "coords": [
        2855.7495719943154,
        2219.61138966494
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [
          "Hydian Way"
        ],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Karfeddion": {
      "coords": [
        612.3046875,
        3067.3828125
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-18",
        "row": 18
      },
      "labels": {
        "preferred_dir": "below"
      },
      "routes": {
        "major": [],
        "medium": [
          "Karfeddion–Eriadu Hyperlane"
        ],
        "minor_neighbors": []
      },
      "sector": "Senex"
    },
    "Kath": {
      "coords": [
        2554.919913912784,
        1629.816769064402
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Dustig Trace"
        ],
        "minor_neighbors": []
      },
      "sector": "Dustig"
    },
    "Kelrodo-Ai": {
      "coords": [
        870.1171875,
        4451.66015625
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Lipsec Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Sluis"
    },
    "Kerest": {
      "coords": [
        1863.28125,
        5248.53515625
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "H'Nemthe",
          "Vixoseph"
        ]
      },
      "sector": "Sluis"
    },
    "Kessar": {
      "coords": [
        3632.8125,
        2061.03515625
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Duros Space Run"
        ],
        "minor_neighbors": [
          "Crait"
        ]
      },
      "sector": "Grumani"
    },
    "Kirdo": {
      "coords": [
        3987.3046875,
        5110.83984375
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Sanrafsix Corridor"
        ],
        "minor_neighbors": [
          "Rior",
          "Stygmarn",
          "Bartokan"
        ]
      },
      "sector": "Tamarin"
    },
    "Lanthe": {
      "coords": [
        2110.516280102425,
        1160.5498725012883
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [
          "Rimma Trade Route"
        ],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Var Hagen"
    },
    "Loposi": {
      "coords": [
        2575,
        1933
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Tshindral",
          "Haruun Kal"
        ]
      },
      "sector": "Dustig"
    },
    "Luxiar": {
      "coords": [
        3971.19140625,
        3032.2265625
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {
        "preferred_dir": "above"
      },
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Gonda",
          "Zairona",
          "Arbra"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "Malastare": {
      "coords": [
        3093.75,
        1256.8359375
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [
          "Hydian Way"
        ],
        "medium": [
          "Dustig Trace"
        ],
        "minor_neighbors": [
          "Umgul and Dargul"
        ]
      },
      "sector": "Grumani"
    },
    "Medth": {
      "coords": [
        2235,
        1986
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Ado Spine"
        ],
        "minor_neighbors": []
      },
      "sector": "Ado"
    },
    "Naalol": {
      "coords": [
        377.9296875,
        1514.6484375
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Spirva"
    },
    "Naboo": {
      "coords": [
        5021.484375,
        1608.3984375
      ],
      "editor_notes": "",
      "grid": {
        "col": "O",
        "grid": "O-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Duros Space Run",
          "Enarc Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Najan-Rovi": {
      "coords": [
        2292.48046875,
        2531.25
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [
          "Rimma Trade Route"
        ],
        "medium": [],
        "minor_neighbors": [
          "Darkknell"
        ]
      },
      "sector": "Brema"
    },
    "Neelanon": {
      "coords": [
        672.36328125,
        2983.88671875
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Karfeddion–Eriadu Hyperlane"
        ],
        "minor_neighbors": []
      },
      "sector": "Senex"
    },
    "Nellac Kram": {
      "coords": [
        3824.70703125,
        3500.9765625
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {
        "preferred_dir": "left"
      },
      "routes": {
        "major": [],
        "medium": [
          "Sharlissia Trade Corridor"
        ],
        "minor_neighbors": [
          "Cerroban"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "Nigel": {
      "coords": [
        4449.438403119508,
        157.1891023420785
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Enarc Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Kira"
    },
    "Nilash": {
      "coords": [
        2807.3171912608195,
        2487.767745185525
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Nuralee": {
      "coords": [
        3624.8654051204016,
        518.4106956924663
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Tyus"
    },
    "Nuvar": {
      "coords": [
        3250.9579378599565,
        1697.2798670386526
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Dustig"
    },
    "Oanne": {
      "coords": [
        4249.51171875,
        2825.68359375
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Sharlissia"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "Oetchi": {
      "coords": [
        3877.44140625,
        2383.30078125
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Crait"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "Ogem": {
      "coords": [
        145.01953125,
        2569.3359375
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "D'Aelgoth"
    },
    "Old Mankoo": {
      "coords": [
        3643.651095905304,
        1563.5527399905202
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Quess"
    },
    "Omwat": {
      "coords": [
        3373.53515625,
        3111.328125
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {
        "preferred_dir": "left"
      },
      "routes": {
        "major": [],
        "medium": [
          "Sanrafsix Corridor"
        ],
        "minor_neighbors": [
          "Felne"
        ]
      },
      "sector": "Garis"
    },
    "Opiteihr": {
      "coords": [
        2744.591426526533,
        812.5993913611026
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Enarc Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Var Hagen"
    },
    "Ord Grovner": {
      "coords": [
        5119.62890625,
        4075.1953125
      ],
      "editor_notes": "",
      "grid": {
        "col": "O",
        "grid": "O-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Bartokan"
        ]
      },
      "sector": "Tamarin"
    },
    "Orish": {
      "coords": [
        2576.66015625,
        2875.48828125
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [
          "Hydian Way"
        ],
        "medium": [],
        "minor_neighbors": [
          "Sullust"
        ]
      },
      "sector": "Brema"
    },
    "Orto": {
      "coords": [
        1990.72265625,
        4885.25390625
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Sluis Van"
        ]
      },
      "sector": "Sluis"
    },
    "Pamarthe": {
      "coords": [
        3291.50390625,
        3953.61328125
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Kabal",
          "Sevarcos"
        ]
      },
      "sector": "Tamarin"
    },
    "Parwa": {
      "coords": [
        2311.5234375,
        3080.56640625
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [
          "Rimma Trade Route"
        ],
        "medium": [],
        "minor_neighbors": [
          "Uvena"
        ]
      },
      "sector": "Seswenna"
    },
    "Paucris": {
      "coords": [
        4209.2489780757805,
        3957.68770098041
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Tamarin"
    },
    "Pax": {
      "coords": [
        3267.7462961402134,
        357.3816288137732
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [
          "Hydian Way"
        ],
        "medium": [
          "Enarc Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Kira"
    },
    "Phaegon": {
      "coords": [
        3325.8577140505304,
        2302.859664350645
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Pipada": {
      "coords": [
        1608.3984375,
        3698.73046875
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Eriadu"
        ]
      },
      "sector": "Brema"
    },
    "Polaar": {
      "coords": [
        921.38671875,
        1335.9375
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Praesitlyn": {
      "coords": [
        2352.5390625,
        4502.9296875
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [
          "Rimma Trade Route"
        ],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Sluis"
    },
    "Rilias": {
      "coords": [
        2214.84375,
        3895.01953125
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Averam",
          "Clak'dor"
        ]
      },
      "sector": "Seswenna"
    },
    "Rior": {
      "coords": [
        3682.6171875,
        4070.80078125
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Sanrafsix Corridor"
        ],
        "minor_neighbors": [
          "Daxam",
          "Kirdo"
        ]
      },
      "sector": "Tamarin"
    },
    "Roldalna": {
      "coords": [
        4353.828214047684,
        143.72577297990927
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Enarc Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Kira"
    },
    "Ropagi": {
      "coords": [
        3780.407921806291,
        76.34505378507345
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Enarc Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Kira"
    },
    "Sag Kemper": {
      "coords": [
        3756.3888167849636,
        4270.487543738858
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Sanrafsix Corridor"
        ],
        "minor_neighbors": []
      },
      "sector": "Tamarin"
    },
    "Sanbra": {
      "coords": [
        4759.27734375,
        2305.6640625
      ],
      "editor_notes": "",
      "grid": {
        "col": "O",
        "grid": "O-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Sanbra"
    },
    "Sanrafsix": {
      "coords": [
        3224.12109375,
        2214.84375
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Sanrafsix Corridor",
          "Duros Space Run"
        ],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Sarrassia": {
      "coords": [
        3114.2578125,
        2286.62109375
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Seltos": {
      "coords": [
        4252.782467008807,
        585.8280276781531
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Mulgard"
    },
    "Senex": {
      "coords": [
        669.43359375,
        2935.546875
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-17",
        "row": 17
      },
      "labels": {
        "preferred_dir": "right"
      },
      "routes": {
        "major": [],
        "medium": [
          "Karfeddion–Eriadu Hyperlane"
        ],
        "minor_neighbors": []
      },
      "sector": "Senex"
    },
    "Seswenna": {
      "coords": [
        2419.921875,
        3572.75390625
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-18",
        "row": 18
      },
      "labels": {
        "preferred_dir": "right"
      },
      "routes": {
        "major": [
          "Hydian Way"
        ],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Seswenna"
    },
    "Sevarcos": {
      "coords": [
        3418.9453125,
        4768.06640625
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Sanrafsix Corridor"
        ],
        "minor_neighbors": [
          "Pamarthe"
        ]
      },
      "sector": "Tamarin"
    },
    "Shadda-Bi-Boran": {
      "coords": [
        4835.44921875,
        3071.77734375
      ],
      "editor_notes": "",
      "grid": {
        "col": "O",
        "grid": "O-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Toblain"
    },
    "Sharlissia": {
      "coords": [
        4249.51171875,
        3237.3046875
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Sharlissia Trade Corridor"
        ],
        "minor_neighbors": [
          "Oanne"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "Shumavar": {
      "coords": [
        1289.0625,
        4858.88671875
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [
          "Hydian Way"
        ],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Sluis"
    },
    "Sluis Van": {
      "coords": [
        2362.79296875,
        4709.47265625
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [
          "Rimma Trade Route"
        ],
        "medium": [],
        "minor_neighbors": [
          "Orto"
        ]
      },
      "sector": "Sluis"
    },
    "Speco": {
      "coords": [
        3751.46484375,
        3178.7109375
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {
        "preferred_dir": "right"
      },
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Zairona",
          "Yethra"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "Stygmarn": {
      "coords": [
        3498.046875,
        5248.53515625
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Kirdo",
          "Valo"
        ]
      },
      "sector": "Tamarin"
    },
    "Sullust": {
      "coords": [
        2292.48046875,
        2748.046875
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [
          "Rimma Trade Route"
        ],
        "medium": [],
        "minor_neighbors": [
          "Callos",
          "Orish"
        ]
      },
      "sector": "Brema"
    },
    "Svivren": {
      "coords": [
        5453.61328125,
        5059.5703125
      ],
      "editor_notes": "",
      "grid": {
        "col": "O",
        "grid": "O-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Svivreni"
    },
    "Syned": {
      "coords": [
        3200.68359375,
        2592.7734375
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Sanrafsix Corridor"
        ],
        "minor_neighbors": [
          "Yethra"
        ]
      },
      "sector": "Grumani"
    },
    "Tanta Aurek": {
      "coords": [
        2713.7352407992485,
        2600.5923873090064
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [
          "Hydian Way"
        ],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Tibrin": {
      "coords": [
        1215.8203125,
        3051.26953125
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Gad"
        ]
      },
      "sector": "Hadar"
    },
    "Tiferep": {
      "coords": [
        95.21484375,
        2233.88671875
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "D'Aelgoth"
    },
    "Tramaos": {
      "coords": [
        3059.284961163079,
        2455.336827610209
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Grumani"
    },
    "Trevi": {
      "coords": [
        3989.5544343692395,
        1858.565223453302
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Quess"
    },
    "Triton": {
      "coords": [
        2362.79296875,
        4346.19140625
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [
          "Rimma Trade Route"
        ],
        "medium": [
          "Sharlissia Trade Corridor"
        ],
        "minor_neighbors": [
          "Xagobah"
        ]
      },
      "sector": "Sluis"
    },
    "Tshindral": {
      "coords": [
        2252.9296875,
        2204.58984375
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [
          "Rimma Trade Route"
        ],
        "medium": [],
        "minor_neighbors": [
          "Loposi"
        ]
      },
      "sector": "Ado"
    },
    "Umgul and Dargul": {
      "coords": [
        3805.6640625,
        1133.7890625
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Malastare"
        ]
      },
      "sector": "Mulgard"
    },
    "Uvena": {
      "coords": [
        2693.84765625,
        3218.26171875
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Eriadu",
          "Parwa"
        ]
      },
      "sector": "Seswenna"
    },
    "Valo": {
      "coords": [
        4064.94140625,
        5453.61328125
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Sanrafsix Corridor"
        ],
        "minor_neighbors": [
          "Stygmarn"
        ]
      },
      "sector": "Tamarin"
    },
    "Var-Shaa": {
      "coords": [
        2843,
        1828
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-17",
        "row": 17
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Var-Shaa Spur"
        ],
        "minor_neighbors": [
          "Haruun Kal"
        ]
      },
      "sector": "Dustig"
    },
    "Velga": {
      "coords": [
        246.09375,
        3095.21484375
      ],
      "editor_notes": "",
      "grid": {
        "col": "L",
        "grid": "L-18",
        "row": 18
      },
      "labels": {
        "preferred_dir": "left"
      },
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Juvex"
    },
    "Verdanth": {
      "coords": [
        4013.671875,
        2100.5859375
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {
        "preferred_dir": "right"
      },
      "routes": {
        "major": [],
        "medium": [
          "Duros Space Run"
        ],
        "minor_neighbors": [
          "Arbra"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "Vixoseph": {
      "coords": [
        1981.93359375,
        5532.71484375
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-19",
        "row": 19
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Kerest",
          "Denab and Seatos"
        ]
      },
      "sector": "Sluis"
    },
    "Vogel": {
      "coords": [
        2496.09375,
        1136.71875
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Enarc Run"
        ],
        "minor_neighbors": [
          "Vondarc"
        ]
      },
      "sector": "Var Hagen"
    },
    "Vondarc": {
      "coords": [
        2203.125,
        1363.76953125
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [
          "Rimma Trade Route"
        ],
        "medium": [
          "Enarc Run"
        ],
        "minor_neighbors": [
          "Vogel"
        ]
      },
      "sector": "Grumani"
    },
    "Xagobah": {
      "coords": [
        2812.5,
        4070.80078125
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-18",
        "row": 18
      },
      "labels": {},
      "routes": {
        "major": [],
        "medium": [
          "Sharlissia Trade Corridor"
        ],
        "minor_neighbors": [
          "Triton"
        ]
      },
      "sector": "Tamarin"
    },
    "Yethra": {
      "coords": [
        3604.98046875,
        2446.2890625
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-17",
        "row": 17
      },
      "labels": {
        "preferred_dir": "right"
      },
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Syned",
          "Arbra",
          "Speco",
          "Felne"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "Zairona": {
      "coords": [
        4410.64453125,
        3178.7109375
      ],
      "editor_notes": "",
      "grid": {
        "col": "N",
        "grid": "N-18",
        "row": 18
      },
      "labels": {
        "preferred_dir": "above"
      },
      "routes": {
        "major": [],
        "medium": [],
        "minor_neighbors": [
          "Luxiar",
          "Speco"
        ]
      },
      "sector": "Bon'nyuw-Luq"
    },
    "ZeHeth": {
      "coords": [
        3157.6523582910345,
        1054.0606128997276
      ],
      "editor_notes": "",
      "grid": {
        "col": "M",
        "grid": "M-16",
        "row": 16
      },
      "labels": {},
      "routes": {
        "major": [
          "Hydian Way"
        ],
        "medium": [],
        "minor_neighbors": []
      },
      "sector": "Dustig"
    }
  }
};
